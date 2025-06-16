
import { useRef, useCallback, useMemo } from 'react';

interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: number;
}

interface UseOptimisticStateOptions<T> {
  keyExtractor: (item: T) => string;
  matcher?: (serverItem: T, optimisticItem: T) => boolean;
}

export function useOptimisticState<T>(
  serverData: T[],
  options: UseOptimisticStateOptions<T>
) {
  const optimisticUpdatesRef = useRef<Map<string, OptimisticUpdate<T>>>(new Map());
  const { keyExtractor, matcher } = options;

  const applyOptimisticUpdate = useCallback((
    type: 'create' | 'update' | 'delete',
    item: T,
    tempId?: string
  ) => {
    const id = tempId || keyExtractor(item);
    const update: OptimisticUpdate<T> = {
      id,
      type,
      data: item,
      timestamp: Date.now(),
    };

    optimisticUpdatesRef.current.set(id, update);
    
    // Auto-cleanup after 30 seconds
    setTimeout(() => {
      const currentUpdate = optimisticUpdatesRef.current.get(id);
      if (currentUpdate && currentUpdate.timestamp === update.timestamp) {
        optimisticUpdatesRef.current.delete(id);
      }
    }, 30000);

    return id;
  }, [keyExtractor]);

  const clearOptimisticUpdate = useCallback((id: string) => {
    optimisticUpdatesRef.current.delete(id);
  }, []);

  const clearOptimisticByMatch = useCallback((serverItem: T) => {
    if (!matcher) return;
    
    const updates = Array.from(optimisticUpdatesRef.current.entries());
    updates.forEach(([id, update]) => {
      if (matcher(serverItem, update.data)) {
        optimisticUpdatesRef.current.delete(id);
      }
    });
  }, [matcher]);

  const optimisticData = useMemo(() => {
    const updates = Array.from(optimisticUpdatesRef.current.values());
    let result = [...serverData];

    // Apply optimistic updates
    updates.forEach(update => {
      switch (update.type) {
        case 'create':
          // Only add if not already in server data
          const exists = result.some(item => {
            if (matcher) {
              return matcher(item, update.data);
            }
            return keyExtractor(item) === keyExtractor(update.data);
          });
          if (!exists) {
            result.push(update.data);
          }
          break;

        case 'update':
          result = result.map(item => 
            keyExtractor(item) === keyExtractor(update.data) ? update.data : item
          );
          break;

        case 'delete':
          result = result.filter(item => 
            keyExtractor(item) !== keyExtractor(update.data)
          );
          break;
      }
    });

    return result;
  }, [serverData, keyExtractor, matcher]);

  const hasOptimisticChanges = optimisticUpdatesRef.current.size > 0;

  const revertAllOptimisticChanges = useCallback(() => {
    optimisticUpdatesRef.current.clear();
  }, []);

  return {
    optimisticData,
    applyOptimisticUpdate,
    clearOptimisticUpdate,
    clearOptimisticByMatch,
    hasOptimisticChanges,
    revertAllOptimisticChanges,
  };
}
