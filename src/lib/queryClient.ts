
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

// Export the main query client as well for other parts of the app
export { queryClient } from '@tanstack/react-query';
