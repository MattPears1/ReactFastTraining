import {injectable, inject} from '@loopback/core';
import {v4 as uuid} from 'uuid';
import {DataSource} from '@loopback/repository';

export interface DomainEvent {
  eventId: string;
  eventType: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  sequenceNumber: number;
  timestamp: Date;
  userId?: string;
  payload: any;
  metadata?: Record<string, any>;
}

export interface EventStream {
  aggregateId: string;
  aggregateType: string;
  version: number;
  events: DomainEvent[];
}

export interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: any;
  timestamp: Date;
}

@injectable()
export class EventStore {
  private eventHandlers: Map<string, ((event: DomainEvent) => Promise<void>)[]> = new Map();
  private projections: Map<string, any> = new Map();
  
  constructor(
    @inject('datasources.postgres')
    private dataSource: DataSource,
    @inject('services.monitoring')
    private monitoring: any
  ) {
    this.initializeSchema();
  }

  /**
   * Initialize event store schema
   */
  private async initializeSchema(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS event_store (
        event_id UUID PRIMARY KEY,
        event_type VARCHAR(255) NOT NULL,
        event_version INTEGER NOT NULL,
        aggregate_id UUID NOT NULL,
        aggregate_type VARCHAR(255) NOT NULL,
        sequence_number INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        user_id UUID,
        payload JSONB NOT NULL,
        metadata JSONB,
        UNIQUE(aggregate_id, sequence_number)
      );

      CREATE INDEX IF NOT EXISTS idx_event_store_aggregate 
        ON event_store(aggregate_id, sequence_number);
      
      CREATE INDEX IF NOT EXISTS idx_event_store_type 
        ON event_store(event_type);
      
      CREATE INDEX IF NOT EXISTS idx_event_store_timestamp 
        ON event_store(timestamp);

      CREATE TABLE IF NOT EXISTS event_snapshots (
        aggregate_id UUID NOT NULL,
        aggregate_type VARCHAR(255) NOT NULL,
        version INTEGER NOT NULL,
        state JSONB NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (aggregate_id, version)
      );

      CREATE TABLE IF NOT EXISTS event_stream_metadata (
        stream_id VARCHAR(255) PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 0,
        metadata JSONB
      );
    `;

    await this.dataSource.execute(sql);
  }

  /**
   * Append events to the event store
   */
  async appendEvents(
    aggregateId: string,
    aggregateType: string,
    events: Omit<DomainEvent, 'eventId' | 'sequenceNumber' | 'timestamp'>[],
    expectedVersion?: number
  ): Promise<DomainEvent[]> {
    const trx = await this.dataSource.beginTransaction();
    
    try {
      // Get current version
      const currentVersion = await this.getAggregateVersion(aggregateId, trx);
      
      // Check expected version for optimistic concurrency
      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new Error(
          `Concurrency conflict: expected version ${expectedVersion}, but current version is ${currentVersion}`
        );
      }

      const appendedEvents: DomainEvent[] = [];
      let sequenceNumber = currentVersion + 1;

      for (const event of events) {
        const domainEvent: DomainEvent = {
          ...event,
          eventId: uuid(),
          aggregateId,
          aggregateType,
          sequenceNumber,
          timestamp: new Date(),
        };

        // Insert event
        await trx.execute(
          `INSERT INTO event_store (
            event_id, event_type, event_version, aggregate_id, 
            aggregate_type, sequence_number, timestamp, user_id, 
            payload, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            domainEvent.eventId,
            domainEvent.eventType,
            domainEvent.eventVersion,
            domainEvent.aggregateId,
            domainEvent.aggregateType,
            domainEvent.sequenceNumber,
            domainEvent.timestamp,
            domainEvent.userId,
            JSON.stringify(domainEvent.payload),
            domainEvent.metadata ? JSON.stringify(domainEvent.metadata) : null,
          ]
        );

        appendedEvents.push(domainEvent);
        sequenceNumber++;
      }

      // Update stream metadata
      await this.updateStreamMetadata(aggregateId, sequenceNumber - 1, trx);

      await trx.commit();

      // Publish events to handlers
      for (const event of appendedEvents) {
        await this.publishEvent(event);
      }

      // Record metrics
      this.monitoring.recordMetric({
        name: 'event_store.events_appended',
        value: appendedEvents.length,
        unit: 'count',
        tags: { aggregate_type: aggregateType },
      });

      return appendedEvents;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Get events for an aggregate
   */
  async getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<DomainEvent[]> {
    let query = `
      SELECT * FROM event_store 
      WHERE aggregate_id = $1
    `;
    const params: any[] = [aggregateId];

    if (fromVersion !== undefined) {
      query += ` AND sequence_number >= $${params.length + 1}`;
      params.push(fromVersion);
    }

    if (toVersion !== undefined) {
      query += ` AND sequence_number <= $${params.length + 1}`;
      params.push(toVersion);
    }

    query += ' ORDER BY sequence_number ASC';

    const result = await this.dataSource.execute(query, params);
    
    return result.map((row: any) => ({
      eventId: row.event_id,
      eventType: row.event_type,
      eventVersion: row.event_version,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      sequenceNumber: row.sequence_number,
      timestamp: row.timestamp,
      userId: row.user_id,
      payload: row.payload,
      metadata: row.metadata,
    }));
  }

  /**
   * Get event stream for an aggregate
   */
  async getEventStream(
    aggregateId: string,
    fromSnapshot?: boolean
  ): Promise<EventStream> {
    let events: DomainEvent[];
    let version = 0;
    let aggregateType = '';

    if (fromSnapshot) {
      const snapshot = await this.getLatestSnapshot(aggregateId);
      if (snapshot) {
        version = snapshot.version;
        aggregateType = snapshot.aggregateType;
        events = await this.getEvents(aggregateId, version + 1);
      } else {
        events = await this.getEvents(aggregateId);
      }
    } else {
      events = await this.getEvents(aggregateId);
    }

    if (events.length > 0) {
      aggregateType = events[0].aggregateType;
      version = events[events.length - 1].sequenceNumber;
    }

    return {
      aggregateId,
      aggregateType,
      version,
      events,
    };
  }

  /**
   * Save snapshot
   */
  async saveSnapshot(snapshot: Snapshot): Promise<void> {
    await this.dataSource.execute(
      `INSERT INTO event_snapshots (
        aggregate_id, aggregate_type, version, state, timestamp
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (aggregate_id, version) DO UPDATE
      SET state = EXCLUDED.state, timestamp = EXCLUDED.timestamp`,
      [
        snapshot.aggregateId,
        snapshot.aggregateType,
        snapshot.version,
        JSON.stringify(snapshot.state),
        snapshot.timestamp,
      ]
    );

    this.monitoring.recordMetric({
      name: 'event_store.snapshot_saved',
      value: 1,
      unit: 'count',
      tags: { aggregate_type: snapshot.aggregateType },
    });
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(aggregateId: string): Promise<Snapshot | null> {
    const result = await this.dataSource.execute(
      `SELECT * FROM event_snapshots 
       WHERE aggregate_id = $1 
       ORDER BY version DESC 
       LIMIT 1`,
      [aggregateId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      version: row.version,
      state: row.state,
      timestamp: row.timestamp,
    };
  }

  /**
   * Subscribe to events
   */
  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    this.eventHandlers.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get aggregate version
   */
  private async getAggregateVersion(
    aggregateId: string,
    trx?: any
  ): Promise<number> {
    const dataSource = trx || this.dataSource;
    const result = await dataSource.execute(
      `SELECT COALESCE(MAX(sequence_number), 0) as version 
       FROM event_store 
       WHERE aggregate_id = $1`,
      [aggregateId]
    );

    return result[0].version;
  }

  /**
   * Update stream metadata
   */
  private async updateStreamMetadata(
    streamId: string,
    version: number,
    trx?: any
  ): Promise<void> {
    const dataSource = trx || this.dataSource;
    await dataSource.execute(
      `INSERT INTO event_stream_metadata (stream_id, version) 
       VALUES ($1, $2)
       ON CONFLICT (stream_id) DO UPDATE 
       SET version = EXCLUDED.version`,
      [streamId, version]
    );
  }

  /**
   * Publish event to handlers
   */
  private async publishEvent(event: DomainEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.eventType) || [];
    const allHandlers = this.eventHandlers.get('*') || [];

    const promises = [...handlers, ...allHandlers].map(handler =>
      handler(event).catch(error => {
        console.error(`Error in event handler for ${event.eventType}:`, error);
        this.monitoring.recordMetric({
          name: 'event_store.handler_error',
          value: 1,
          unit: 'count',
          tags: { event_type: event.eventType },
        });
      })
    );

    await Promise.all(promises);
  }

  /**
   * Get all events by type within a time range
   */
  async getEventsByType(
    eventType: string,
    startTime: Date,
    endTime: Date,
    limit: number = 1000
  ): Promise<DomainEvent[]> {
    const result = await this.dataSource.execute(
      `SELECT * FROM event_store 
       WHERE event_type = $1 
       AND timestamp >= $2 
       AND timestamp <= $3
       ORDER BY timestamp DESC
       LIMIT $4`,
      [eventType, startTime, endTime, limit]
    );

    return result.map((row: any) => ({
      eventId: row.event_id,
      eventType: row.event_type,
      eventVersion: row.event_version,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      sequenceNumber: row.sequence_number,
      timestamp: row.timestamp,
      userId: row.user_id,
      payload: row.payload,
      metadata: row.metadata,
    }));
  }

  /**
   * Replay events from a specific point
   */
  async replayEvents(
    fromTimestamp: Date,
    eventTypes?: string[]
  ): Promise<void> {
    let query = `
      SELECT * FROM event_store 
      WHERE timestamp >= $1
    `;
    const params: any[] = [fromTimestamp];

    if (eventTypes && eventTypes.length > 0) {
      query += ` AND event_type = ANY($${params.length + 1})`;
      params.push(eventTypes);
    }

    query += ' ORDER BY timestamp ASC';

    const events = await this.dataSource.execute(query, params);

    for (const row of events) {
      const event: DomainEvent = {
        eventId: row.event_id,
        eventType: row.event_type,
        eventVersion: row.event_version,
        aggregateId: row.aggregate_id,
        aggregateType: row.aggregate_type,
        sequenceNumber: row.sequence_number,
        timestamp: row.timestamp,
        userId: row.user_id,
        payload: row.payload,
        metadata: row.metadata,
      };

      await this.publishEvent(event);
    }

    this.monitoring.recordMetric({
      name: 'event_store.events_replayed',
      value: events.length,
      unit: 'count',
    });
  }
}