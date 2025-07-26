import { Pool } from 'pg';
import {
  IAnalyticsEvent,
  IPageView,
  IConversion,
  IPeriod,
} from '../../interfaces/analytics.interface';
import { logger } from '../../utils/logger';

export class AnalyticsStore {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.initializeTables();
  }

  private async initializeTables(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id UUID PRIMARY KEY,
          user_id VARCHAR(255),
          session_id VARCHAR(255) NOT NULL,
          event VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          properties JSONB,
          timestamp TIMESTAMP NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          referrer TEXT,
          url TEXT,
          device JSONB,
          location JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_user_id (user_id),
          INDEX idx_session_id (session_id),
          INDEX idx_timestamp (timestamp),
          INDEX idx_event_category (event, category)
        );

        CREATE TABLE IF NOT EXISTS analytics_sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          started_at TIMESTAMP NOT NULL,
          ended_at TIMESTAMP,
          page_views INTEGER DEFAULT 0,
          events INTEGER DEFAULT 0,
          duration INTEGER,
          bounce BOOLEAN DEFAULT false,
          
          INDEX idx_user_sessions (user_id),
          INDEX idx_active_sessions (ended_at)
        );

        CREATE TABLE IF NOT EXISTS analytics_conversions (
          id UUID PRIMARY KEY,
          user_id VARCHAR(255),
          session_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          value DECIMAL(10, 2),
          currency VARCHAR(3),
          source VARCHAR(255),
          medium VARCHAR(255),
          campaign VARCHAR(255),
          metadata JSONB,
          timestamp TIMESTAMP NOT NULL,
          
          INDEX idx_conversion_user (user_id),
          INDEX idx_conversion_type (type),
          INDEX idx_conversion_timestamp (timestamp)
        );

        CREATE TABLE IF NOT EXISTS analytics_user_traits (
          user_id VARCHAR(255) PRIMARY KEY,
          traits JSONB,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS analytics_page_stats (
          url VARCHAR(1000) PRIMARY KEY,
          views INTEGER DEFAULT 0,
          unique_views INTEGER DEFAULT 0,
          total_time INTEGER DEFAULT 0,
          bounces INTEGER DEFAULT 0,
          exits INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      logger.error('Failed to initialize analytics tables', { error });
    }
  }

  async saveEvent(event: IAnalyticsEvent): Promise<void> {
    const query = `
      INSERT INTO analytics_events (
        id, user_id, session_id, event, category, properties,
        timestamp, ip_address, user_agent, referrer, url, device, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    const values = [
      event.id,
      event.userId,
      event.sessionId,
      event.event,
      event.category,
      JSON.stringify(event.properties),
      event.timestamp,
      event.ipAddress,
      event.userAgent,
      event.referrer,
      event.url,
      JSON.stringify(event.device),
      JSON.stringify(event.location),
    ];

    await this.pool.query(query, values);
    await this.updateSession(event.sessionId, event.userId);
  }

  async updateSession(sessionId: string, userId?: string): Promise<void> {
    const query = `
      INSERT INTO analytics_sessions (id, user_id, started_at, events)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 1)
      ON CONFLICT (id) DO UPDATE
      SET events = analytics_sessions.events + 1,
          ended_at = CURRENT_TIMESTAMP,
          duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - analytics_sessions.started_at))
    `;

    await this.pool.query(query, [sessionId, userId]);
  }

  async saveConversion(conversion: IConversion): Promise<void> {
    const query = `
      INSERT INTO analytics_conversions (
        id, user_id, session_id, type, value, currency,
        source, medium, campaign, metadata, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    const values = [
      conversion.id,
      conversion.userId,
      conversion.sessionId,
      conversion.type,
      conversion.value,
      conversion.currency,
      conversion.source,
      conversion.medium,
      conversion.campaign,
      JSON.stringify(conversion.metadata),
      conversion.timestamp,
    ];

    await this.pool.query(query, values);
  }

  async saveUserTraits(userId: string, traits?: Record<string, any>): Promise<void> {
    const query = `
      INSERT INTO analytics_user_traits (user_id, traits, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE
      SET traits = analytics_user_traits.traits || $2,
          updated_at = CURRENT_TIMESTAMP
    `;

    await this.pool.query(query, [userId, JSON.stringify(traits || {})]);
  }

  async getUserEvents(userId: string): Promise<IAnalyticsEvent[]> {
    const query = `
      SELECT * FROM analytics_events
      WHERE user_id = $1
      ORDER BY timestamp DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows.map(this.mapRowToEvent);
  }

  async getUserSessions(userId: string): Promise<any[]> {
    const query = `
      SELECT * FROM analytics_sessions
      WHERE user_id = $1
      ORDER BY started_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getUserTraits(userId: string): Promise<Record<string, any> | null> {
    const query = `SELECT traits FROM analytics_user_traits WHERE user_id = $1`;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0]?.traits || null;
  }

  async getUserConversions(userId: string): Promise<IConversion[]> {
    const query = `
      SELECT * FROM analytics_conversions
      WHERE user_id = $1
      ORDER BY timestamp DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getEvents(period: IPeriod): Promise<IAnalyticsEvent[]> {
    const query = `
      SELECT * FROM analytics_events
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp DESC
    `;

    const result = await this.pool.query(query, [period.start, period.end]);
    return result.rows.map(this.mapRowToEvent);
  }

  async getActiveSessions(since: Date): Promise<any[]> {
    const query = `
      SELECT DISTINCT session_id, user_id
      FROM analytics_events
      WHERE timestamp >= $1
    `;

    const result = await this.pool.query(query, [since]);
    return result.rows;
  }

  async getTopPages(limit: number): Promise<IPageView[]> {
    const query = `
      SELECT 
        url,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as unique_views,
        AVG(CAST(properties->>'timeOnPage' AS INTEGER)) as avg_time_on_page
      FROM analytics_events
      WHERE event = 'page_view'
      GROUP BY url
      ORDER BY views DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => ({
      url: row.url,
      title: '',
      loadTime: 0,
      timeOnPage: row.avg_time_on_page || 0,
      scrollDepth: 0,
      exits: 0,
      bounces: 0,
    }));
  }

  async getEventCount(start: Date, end: Date): Promise<number> {
    const query = `
      SELECT COUNT(*) FROM analytics_events
      WHERE timestamp >= $1 AND timestamp < $2
    `;

    const result = await this.pool.query(query, [start, end]);
    return parseInt(result.rows[0].count);
  }

  async getTotalEventCount(): Promise<number> {
    const query = `SELECT COUNT(*) FROM analytics_events`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count);
  }

  async deleteUserData(userId: string): Promise<void> {
    const queries = [
      'DELETE FROM analytics_events WHERE user_id = $1',
      'DELETE FROM analytics_sessions WHERE user_id = $1',
      'DELETE FROM analytics_conversions WHERE user_id = $1',
      'DELETE FROM analytics_user_traits WHERE user_id = $1',
    ];

    for (const query of queries) {
      await this.pool.query(query, [userId]);
    }
  }

  async cleanup(cutoffDate: Date): Promise<number> {
    const query = `
      DELETE FROM analytics_events
      WHERE timestamp < $1
      RETURNING id
    `;

    const result = await this.pool.query(query, [cutoffDate]);
    return result.rowCount;
  }

  private mapRowToEvent(row: any): IAnalyticsEvent {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      event: row.event,
      category: row.category,
      properties: row.properties,
      timestamp: row.timestamp,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      referrer: row.referrer,
      url: row.url,
      device: row.device,
      location: row.location,
    };
  }
}