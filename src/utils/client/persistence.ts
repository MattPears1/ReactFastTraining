import React from 'react';
import { secureStorage } from './security';
import type { ClientPortalState } from '@/types/client/portal.types';

interface PersistenceConfig {
  version: number;
  migrations?: Record<number, (data: any) => any>;
}

export class DataPersistence {
  private dbName: string;
  private db: IDBDatabase | null = null;
  private config: PersistenceConfig;

  constructor(dbName: string, config: PersistenceConfig) {
    this.dbName = dbName;
    this.config = config;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('pending')) {
          db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'id' });
        }
      };
    });
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry && result.expiry < Date.now()) {
          this.delete(store, key);
          resolve(null);
        } else {
          resolve(result?.data || null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async set<T>(store: string, key: string, data: T, ttl?: number): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      
      const record = {
        key,
        data,
        timestamp: Date.now(),
        expiry: ttl ? Date.now() + ttl : undefined,
      };
      
      const request = objectStore.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(store: string, key: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(store: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const persistence = new DataPersistence('client-portal', {
  version: 1,
});

// Sync manager for offline/online sync
export class SyncManager {
  private syncQueue: Map<string, () => Promise<any>> = new Map();
  private isSyncing = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.sync());
  }

  addToSync(id: string, syncFn: () => Promise<any>): void {
    this.syncQueue.set(id, syncFn);
    
    if (navigator.onLine) {
      this.sync();
    }
  }

  async sync(): Promise<void> {
    if (this.isSyncing || this.syncQueue.size === 0) return;

    this.isSyncing = true;
    const queue = new Map(this.syncQueue);

    for (const [id, syncFn] of queue) {
      try {
        await syncFn();
        this.syncQueue.delete(id);
      } catch (error) {
        console.error(`Sync failed for ${id}:`, error);
      }
    }

    this.isSyncing = false;
  }

  getPendingCount(): number {
    return this.syncQueue.size;
  }
}

export const syncManager = new SyncManager();

// Offline detection hook
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Local state persistence hook
export const usePersistedState = <T>(
  key: string,
  defaultValue: T,
  options: {
    storage?: 'local' | 'session' | 'secure';
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
) => {
  const {
    storage = 'local',
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  const [state, setState] = React.useState<T>(() => {
    try {
      let item: string | null = null;
      
      if (storage === 'local') {
        item = localStorage.getItem(key);
      } else if (storage === 'session') {
        item = sessionStorage.getItem(key);
      } else {
        const secured = secureStorage.getItem<T>(key);
        return secured !== null ? secured : defaultValue;
      }

      return item !== null ? deserialize(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = React.useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextValue = value instanceof Function ? value(prev) : value;
      
      try {
        if (storage === 'local') {
          localStorage.setItem(key, serialize(nextValue));
        } else if (storage === 'session') {
          sessionStorage.setItem(key, serialize(nextValue));
        } else {
          secureStorage.setItem(key, nextValue);
        }
      } catch (error) {
        console.error(`Failed to persist state for key "${key}":`, error);
      }
      
      return nextValue;
    });
  }, [key, storage, serialize]);

  const removeValue = React.useCallback(() => {
    if (storage === 'local') {
      localStorage.removeItem(key);
    } else if (storage === 'session') {
      sessionStorage.removeItem(key);
    } else {
      secureStorage.removeItem(key);
    }
    setState(defaultValue);
  }, [key, storage, defaultValue]);

  return [state, setValue, removeValue] as const;
};

// Cache invalidation strategies
export class CacheInvalidator {
  private invalidationRules = new Map<string, (data: any) => boolean>();

  addRule(pattern: string, rule: (data: any) => boolean): void {
    this.invalidationRules.set(pattern, rule);
  }

  shouldInvalidate(key: string, data: any): boolean {
    for (const [pattern, rule] of this.invalidationRules) {
      if (key.includes(pattern) && rule(data)) {
        return true;
      }
    }
    return false;
  }

  // Common invalidation rules
  static timeBasedRule(maxAge: number): (data: any) => boolean {
    return (data) => {
      if (!data.timestamp) return true;
      return Date.now() - data.timestamp > maxAge;
    };
  }

  static versionBasedRule(currentVersion: string): (data: any) => boolean {
    return (data) => {
      return data.version !== currentVersion;
    };
  }
}