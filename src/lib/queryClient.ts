
import { QueryClient } from '@tanstack/react-query';

// Custom query client with optimized settings for blocks
export const blocksQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (cacheTime is now gcTime in v5)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Set up persistence with IndexedDB (optional - can be called later)
export const setupQueryPersistence = async () => {
  try {
    // Dynamic import to avoid potential circular dependencies
    const { persistQueryClient } = await import('@tanstack/query-persist-client-core');
    const { indexedDBPersister } = await import('./indexedDBPersister');
    
    // Remove await to avoid type conflict
    persistQueryClient({
      queryClient: blocksQueryClient,
      persister: indexedDBPersister,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log('🔧 Query persistence setup complete');
  } catch (error) {
    console.warn('⚠️ Query persistence setup failed:', error);
    // Continue without persistence if it fails
  }
};
