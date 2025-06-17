import { PersistedClient, Persister } from '@tanstack/query-persist-client-core';

const DB_NAME = 'lovable_blocks_cache';
const DB_VERSION = 1;
const CACHE_STORE = 'query_cache';
const MUTATIONS_STORE = 'pending_mutations';
const METADATA_STORE = 'metadata';

interface CacheMetadata {
  version: string;
  timestamp: number;
  userId?: string;
}

interface PendingMutation {
  id: string;
  mutation: {
    mutationFn: string;
    variables: any;
    timestamp: number;
    retryCount: number;
  };
}

class IndexedDBPersister implements Persister {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create cache store
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE);
        }

        // Create pending mutations store
        if (!db.objectStoreNames.contains(MUTATIONS_STORE)) {
          const mutationStore = db.createObjectStore(MUTATIONS_STORE, { keyPath: 'id' });
          mutationStore.createIndex('timestamp', 'mutation.timestamp');
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE);
        }
      };
    });
  }

  async persistClient(client: PersistedClient): Promise<void> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([CACHE_STORE, METADATA_STORE], 'readwrite');

      // Store the cache
      const cacheStore = transaction.objectStore(CACHE_STORE);
      await new Promise<void>((resolve, reject) => {
        const request = cacheStore.put(client, 'cache');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Store metadata
      const metadataStore = transaction.objectStore(METADATA_STORE);
      const metadata: CacheMetadata = {
        version: '1.0.0',
        timestamp: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = metadataStore.put(metadata, 'cache_metadata');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('💾 Cache persisted to IndexedDB');
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  async restoreClient(): Promise<PersistedClient | undefined> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([CACHE_STORE, METADATA_STORE], 'readonly');

      // Check metadata for version compatibility
      const metadataStore = transaction.objectStore(METADATA_STORE);
      const metadata = await new Promise<CacheMetadata | undefined>((resolve, reject) => {
        const request = metadataStore.get('cache_metadata');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (metadata && this.isCacheValid(metadata)) {
        // Restore the cache
        const cacheStore = transaction.objectStore(CACHE_STORE);
        const client = await new Promise<PersistedClient | undefined>((resolve, reject) => {
          const request = cacheStore.get('cache');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        if (client) {
          console.log('🔄 Cache restored from IndexedDB');
          return client;
        }
      } else {
        console.log('🗑️ Cache metadata invalid, clearing cache');
        await this.clearCache();
      }
    } catch (error) {
      console.error('Failed to restore cache:', error);
    }

    return undefined;
  }

  async removeClient(): Promise<void> {
    try {
      await this.clearCache();
      console.log('🗑️ Cache cleared from IndexedDB');
    } catch (error) {
      console.error('Failed to remove cache:', error);
    }
  }

  private isCacheValid(metadata: CacheMetadata): boolean {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    return (
      metadata.version === '1.0.0' &&
      (now - metadata.timestamp) < maxAge
    );
  }

  private async clearCache(): Promise<void> {
    const db = await this.dbPromise;
    const transaction = db.transaction([CACHE_STORE, METADATA_STORE], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(CACHE_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(METADATA_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
  }

  // Methods for managing pending mutations
  async storePendingMutation(mutation: PendingMutation): Promise<void> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction(MUTATIONS_STORE, 'readwrite');
      const store = transaction.objectStore(MUTATIONS_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(mutation);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('📤 Pending mutation stored:', mutation.id);
    } catch (error) {
      console.error('Failed to store pending mutation:', error);
    }
  }

  async getPendingMutations(): Promise<PendingMutation[]> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction(MUTATIONS_STORE, 'readonly');
      const store = transaction.objectStore(MUTATIONS_STORE);

      return new Promise<PendingMutation[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get pending mutations:', error);
      return [];
    }
  }

  async removePendingMutation(id: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction(MUTATIONS_STORE, 'readwrite');
      const store = transaction.objectStore(MUTATIONS_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('✅ Pending mutation removed:', id);
    } catch (error) {
      console.error('Failed to remove pending mutation:', error);
    }
  }

  async clearPendingMutations(): Promise<void> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction(MUTATIONS_STORE, 'readwrite');
      const store = transaction.objectStore(MUTATIONS_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('🗑️ All pending mutations cleared');
    } catch (error) {
      console.error('Failed to clear pending mutations:', error);
    }
  }
}

// Export singleton instance
export const indexedDBPersister = new IndexedDBPersister();
