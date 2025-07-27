import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookingWebSocketClient, 
  getBookingWebSocketClient, 
  AvailabilityUpdate 
} from '@services/websocket/booking-websocket.client';

interface UseSessionAvailabilityOptions {
  autoSubscribe?: boolean;
  onUpdate?: (availability: AvailabilityUpdate) => void;
  onUrgent?: (data: any) => void;
  onFull?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseSessionAvailabilityReturn {
  availability: AvailabilityUpdate | null;
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  activeIntents: Map<string, any>;
  subscribe: (sessionId: string) => Promise<void>;
  unsubscribe: (sessionId: string) => Promise<void>;
  refresh: (sessionId: string) => Promise<void>;
  sendBookingIntent: (spots: number) => void;
  cancelBookingIntent: (spots: number) => void;
}

export function useSessionAvailability(
  sessionId: string | null,
  options: UseSessionAvailabilityOptions = {}
): UseSessionAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeIntents, setActiveIntents] = useState<Map<string, any>>(new Map());
  
  const clientRef = useRef<BookingWebSocketClient | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);
  const currentSessionIdRef = useRef<string | null>(null);

  // Initialize WebSocket client
  useEffect(() => {
    clientRef.current = getBookingWebSocketClient();
    
    // Set up connection status listener
    const unsubConnect = clientRef.current.on('connection:established', () => {
      setIsConnected(true);
      setError(null);
    });

    const unsubDisconnect = clientRef.current.on('connection:lost', () => {
      setIsConnected(false);
    });

    const unsubReconnect = clientRef.current.on('connection:reconnected', () => {
      setIsConnected(true);
      setError(null);
    });

    cleanupRef.current.push(unsubConnect, unsubDisconnect, unsubReconnect);

    // Check initial connection status
    setIsConnected(clientRef.current.isConnected());

    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, []);

  // Subscribe to session
  const subscribe = useCallback(async (sessionId: string) => {
    if (!clientRef.current) return;

    try {
      setLoading(true);
      setError(null);
      
      await clientRef.current.subscribeToSession(sessionId);
      currentSessionIdRef.current = sessionId;

      // Get initial availability
      const initialAvailability = await clientRef.current.getAvailability(sessionId);
      setAvailability(initialAvailability);
    } catch (err) {
      setError(err as Error);
      options.onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Unsubscribe from session
  const unsubscribe = useCallback(async (sessionId: string) => {
    if (!clientRef.current) return;

    try {
      await clientRef.current.unsubscribeFromSession(sessionId);
      if (currentSessionIdRef.current === sessionId) {
        currentSessionIdRef.current = null;
        setAvailability(null);
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  }, []);

  // Refresh availability
  const refresh = useCallback(async (sessionId: string) => {
    if (!clientRef.current) return;

    try {
      setLoading(true);
      const freshAvailability = await clientRef.current.getAvailability(sessionId);
      setAvailability(freshAvailability);
    } catch (err) {
      setError(err as Error);
      options.onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Send booking intent
  const sendBookingIntent = useCallback((spots: number) => {
    if (!clientRef.current || !currentSessionIdRef.current) return;
    clientRef.current.sendBookingIntent(currentSessionIdRef.current, spots);
  }, []);

  // Cancel booking intent
  const cancelBookingIntent = useCallback((spots: number) => {
    if (!clientRef.current || !currentSessionIdRef.current) return;
    clientRef.current.cancelBookingIntent(currentSessionIdRef.current, spots);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!clientRef.current || !sessionId) return;

    const listeners: (() => void)[] = [];

    // Availability update listener
    const unsubUpdate = clientRef.current.on<AvailabilityUpdate>(
      `availability:${sessionId}`,
      (data) => {
        setAvailability(data);
        options.onUpdate?.(data);
      }
    );
    listeners.push(unsubUpdate);

    // Urgent availability listener
    const unsubUrgent = clientRef.current.on('availability:urgent', (data) => {
      if (data.sessionId === sessionId) {
        options.onUrgent?.(data);
      }
    });
    listeners.push(unsubUrgent);

    // Full session listener
    const unsubFull = clientRef.current.on('availability:full', (data) => {
      if (data.sessionId === sessionId) {
        options.onFull?.(data);
      }
    });
    listeners.push(unsubFull);

    // Booking intent listeners
    const unsubIntentActive = clientRef.current.on('booking:intent:active', (data) => {
      if (data.sessionId === sessionId) {
        setActiveIntents(prev => {
          const next = new Map(prev);
          next.set(data.userId || 'anonymous', data);
          return next;
        });
      }
    });
    listeners.push(unsubIntentActive);

    const unsubIntentCancelled = clientRef.current.on('booking:intent:cancelled', (data) => {
      if (data.sessionId === sessionId) {
        setActiveIntents(prev => {
          const next = new Map(prev);
          next.delete(data.userId || 'anonymous');
          return next;
        });
      }
    });
    listeners.push(unsubIntentCancelled);

    // Error listener
    const unsubError = clientRef.current.on('error', (error) => {
      setError(new Error(error.message || 'WebSocket error'));
      options.onError?.(error);
    });
    listeners.push(unsubError);

    // Auto-subscribe if enabled and not already subscribed
    if (options.autoSubscribe !== false && currentSessionIdRef.current !== sessionId) {
      subscribe(sessionId);
    }

    return () => {
      listeners.forEach(cleanup => cleanup());
    };
  }, [sessionId, options, subscribe]);

  // Cleanup expired intents
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIntents(prev => {
        const next = new Map(prev);
        const now = new Date();
        
        for (const [userId, intent] of next.entries()) {
          if (new Date(intent.expiresAt) < now) {
            next.delete(userId);
          }
        }
        
        return next.size !== prev.size ? next : prev;
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    availability,
    loading,
    error,
    isConnected,
    activeIntents,
    subscribe,
    unsubscribe,
    refresh,
    sendBookingIntent,
    cancelBookingIntent,
  };
}

// Hook for multiple sessions
export function useMultipleSessionAvailability(
  sessionIds: string[],
  options: Omit<UseSessionAvailabilityOptions, 'autoSubscribe'> = {}
) {
  const [availabilities, setAvailabilities] = useState<Map<string, AvailabilityUpdate>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const clientRef = useRef<BookingWebSocketClient | null>(null);

  useEffect(() => {
    if (sessionIds.length === 0) return;

    const client = getBookingWebSocketClient();
    clientRef.current = client;

    const subscribeToAll = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await client.subscribeToSessions(sessionIds);
        
        // Get initial availability for all sessions
        const availabilityPromises = sessionIds.map(id => 
          client.getAvailability(id).then(data => ({ id, data }))
        );
        
        const results = await Promise.allSettled(availabilityPromises);
        const newAvailabilities = new Map<string, AvailabilityUpdate>();
        
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            newAvailabilities.set(result.value.id, result.value.data);
          }
        });
        
        setAvailabilities(newAvailabilities);
      } catch (err) {
        setError(err as Error);
        options.onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    // Set up listeners for each session
    const unsubscribers: (() => void)[] = [];
    
    sessionIds.forEach(sessionId => {
      const unsub = client.on<AvailabilityUpdate>(
        `availability:${sessionId}`,
        (data) => {
          setAvailabilities(prev => {
            const next = new Map(prev);
            next.set(sessionId, data);
            return next;
          });
          options.onUpdate?.(data);
        }
      );
      unsubscribers.push(unsub);
    });

    // Connection status
    const unsubConnect = client.on('connection:established', () => {
      setIsConnected(true);
    });
    unsubscribers.push(unsubConnect);

    const unsubDisconnect = client.on('connection:lost', () => {
      setIsConnected(false);
    });
    unsubscribers.push(unsubDisconnect);

    subscribeToAll();

    return () => {
      unsubscribers.forEach(unsub => unsub());
      sessionIds.forEach(id => {
        client.unsubscribeFromSession(id).catch(console.error);
      });
    };
  }, [sessionIds.join(','), options]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    availabilities,
    loading,
    error,
    isConnected,
  };
}