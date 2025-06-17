
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { indexedDBPersister } from './indexedDBPersister';

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

// Set up persistence with IndexedDB
export const setupQueryPersistence = () => {
  persistQueryClient({
    queryClient: blocksQueryClient,
    persister: indexedDBPersister,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Only persist block queries
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey[0] === 'blocks';
      },
    },
  });

  console.log('🔧 Query persistence setup complete');
};
