// IndexedDB service for offline data caching
// Manages storage and retrieval of pit and match scouting data when offline

import type { 
  QueuedEntry, 
  QueuedPitEntry, 
  QueuedMatchEntry, 
  SyncResult, 
  SyncConfig,
  SyncStatus 
} from '@/lib/offline-types';
import { DB_NAME, DB_VERSION, STORES } from '@/lib/offline-types';
import type { PitEntry, MatchEntry } from '@/lib/shared-types';

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  // Initialize IndexedDB connection
  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB is only available in browser environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create queue store for pending entries
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          const queueStore = db.createObjectStore(STORES.QUEUE, { keyPath: 'id' });
          queueStore.createIndex('type', 'type');
          queueStore.createIndex('status', 'status');
          queueStore.createIndex('createdAt', 'createdAt');
        }

        // Create sync log store for tracking sync operations
        if (!db.objectStoreNames.contains(STORES.SYNC_LOG)) {
          const syncStore = db.createObjectStore(STORES.SYNC_LOG, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp');
        }

        // Create config store for sync settings
        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
        }
      };
    });
  }

  // Ensure database is initialized
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Generate unique ID for queue entries
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add pit entry to offline queue
  async queuePitEntry(data: Omit<PitEntry, 'id'>): Promise<string> {
    const db = await this.ensureDb();
    const id = this.generateId();
    
    const queuedEntry: QueuedPitEntry = {
      id,
      type: 'pit',
      status: 'pending',
      data,
      createdAt: new Date(),
      attempts: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const request = store.add(queuedEntry);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Failed to queue pit entry'));
    });
  }

  // Add match entry to offline queue
  async queueMatchEntry(data: Omit<MatchEntry, 'id'>): Promise<string> {
    const db = await this.ensureDb();
    const id = this.generateId();
    
    const queuedEntry: QueuedMatchEntry = {
      id,
      type: 'match',
      status: 'pending',
      data,
      createdAt: new Date(),
      attempts: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const request = store.add(queuedEntry);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Failed to queue match entry'));
    });
  }

  // Get all pending entries
  async getPendingEntries(): Promise<QueuedEntry[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.QUEUE);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get pending entries'));
    });
  }

  // Get all queued entries (any status)
  async getAllQueuedEntries(): Promise<QueuedEntry[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.QUEUE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get queued entries'));
    });
  }

  // Update entry status
  async updateEntryStatus(
    id: string, 
    status: SyncStatus, 
    remoteId?: number, 
    error?: string
  ): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (!entry) {
          reject(new Error('Entry not found'));
          return;
        }

        entry.status = status;
        entry.lastAttempt = new Date();
        entry.attempts += 1;
        
        if (remoteId) {
          entry.remoteId = remoteId;
        }
        
        if (error) {
          entry.error = error;
        }

        const putRequest = store.put(entry);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error('Failed to update entry status'));
      };

      getRequest.onerror = () => reject(new Error('Failed to get entry for update'));
    });
  }

  // Remove entry from queue
  async removeEntry(id: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove entry'));
    });
  }

  // Clear all synced entries
  async clearSyncedEntries(): Promise<number> {
    const db = await this.ensureDb();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const index = store.index('status');
      const request = index.openCursor('synced');

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(new Error('Failed to clear synced entries'));
    });
  }

  // Get count of entries by status
  async getEntryCount(status?: SyncStatus): Promise<number> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.QUEUE);
      
      let request: IDBRequest;
      if (status) {
        const index = store.index('status');
        request = index.count(status);
      } else {
        request = store.count();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get entry count'));
    });
  }

  // Log sync operation result
  async logSyncResult(result: SyncResult): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_LOG], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_LOG);
      const request = store.add(result);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to log sync result'));
    });
  }

  // Get recent sync logs
  async getRecentSyncLogs(limit = 10): Promise<SyncResult[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_LOG], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_LOG);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const results: SyncResult[] = [];
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(new Error('Failed to get sync logs'));
    });
  }

  // Save sync configuration
  async setSyncConfig(config: SyncConfig): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CONFIG], 'readwrite');
      const store = transaction.objectStore(STORES.CONFIG);
      const request = store.put({ key: 'syncConfig', value: config });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save sync config'));
    });
  }

  // Get sync configuration
  async getSyncConfig(): Promise<SyncConfig | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CONFIG], 'readonly');
      const store = transaction.objectStore(STORES.CONFIG);
      const request = store.get('syncConfig');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(new Error('Failed to get sync config'));
    });
  }

  // Clear all data (useful for testing/reset)
  async clearAllData(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE, STORES.SYNC_LOG, STORES.CONFIG], 'readwrite');
      
      let completed = 0;
      const storeNames = [STORES.QUEUE, STORES.SYNC_LOG, STORES.CONFIG];
      
      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === storeNames.length) {
            resolve();
          }
        };
        
        request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
      });
    });
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();