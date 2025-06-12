
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface UseViewCacheProps {
  cacheKey: string;
  ttl?: number; // Time to live in milliseconds
}

export function useViewCache<T>({ cacheKey, ttl = 5 * 60 * 1000 }: UseViewCacheProps) {
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());
  const [cacheHits, setCacheHits] = useState<Record<string, number>>({});
  const [cacheMisses, setCacheMisses] = useState<Record<string, number>>({});

  // Stabilize cache key and TTL to prevent re-creation
  const stableCacheKey = useRef(cacheKey);
  const stableTtl = useRef(ttl);
  
  // Only update refs if values actually change
  if (stableCacheKey.current !== cacheKey) {
    console.log('useViewCache: Cache key changed', { old: stableCacheKey.current, new: cacheKey });
    stableCacheKey.current = cacheKey;
  }
  if (stableTtl.current !== ttl) {
    console.log('useViewCache: TTL changed', { old: stableTtl.current, new: ttl });
    stableTtl.current = ttl;
  }

  const getCacheStats = useCallback(() => {
    const hits = cacheHits[stableCacheKey.current] || 0;
    const misses = cacheMisses[stableCacheKey.current] || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    return {
      hits,
      misses,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: cache.size
    };
  }, [cacheHits, cacheMisses, cache.size]);

  const isValidEntry = useCallback((entry: CacheEntry<T>) => {
    return Date.now() - entry.timestamp < stableTtl.current;
  }, []);

  const get = useCallback((key: string): T | null => {
    const fullKey = `${stableCacheKey.current}:${key}`;
    const entry = cache.get(fullKey);
    
    console.log('useViewCache: get called', { key, fullKey, hasEntry: !!entry });
    
    if (entry && isValidEntry(entry)) {
      console.log('useViewCache: Cache hit', { key });
      setCacheHits(prev => ({
        ...prev,
        [stableCacheKey.current]: (prev[stableCacheKey.current] || 0) + 1
      }));
      return entry.data;
    }
    
    if (entry) {
      console.log('useViewCache: Entry expired, removing', { key });
      // Remove expired entry
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(fullKey);
        return newCache;
      });
    }
    
    console.log('useViewCache: Cache miss', { key });
    setCacheMisses(prev => ({
      ...prev,
      [stableCacheKey.current]: (prev[stableCacheKey.current] || 0) + 1
    }));
    
    return null;
  }, [cache, isValidEntry]);

  const set = useCallback((key: string, data: T, version = 1) => {
    const fullKey = `${stableCacheKey.current}:${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version
    };
    
    console.log('useViewCache: set called', { key, fullKey });
    setCache(prev => new Map(prev).set(fullKey, entry));
  }, []);

  const invalidate = useCallback((keyPattern?: string) => {
    console.log('useViewCache: invalidate called', { keyPattern });
    
    if (keyPattern) {
      setCache(prev => {
        const newCache = new Map(prev);
        for (const key of newCache.keys()) {
          if (key.startsWith(`${stableCacheKey.current}:${keyPattern}`)) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
    } else {
      setCache(prev => {
        const newCache = new Map(prev);
        for (const key of newCache.keys()) {
          if (key.startsWith(`${stableCacheKey.current}:`)) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
    }
  }, []);

  const clear = useCallback(() => {
    console.log('useViewCache: clear called');
    setCache(new Map());
    setCacheHits({});
    setCacheMisses({});
  }, []);

  // Cleanup expired entries periodically - use stable TTL ref
  useEffect(() => {
    console.log('useViewCache: Setting up cleanup interval', { ttl: stableTtl.current });
    
    const interval = setInterval(() => {
      setCache(prev => {
        const newCache = new Map();
        let removedCount = 0;
        
        for (const [key, entry] of prev.entries()) {
          if (isValidEntry(entry)) {
            newCache.set(key, entry);
          } else {
            removedCount++;
          }
        }
        
        if (removedCount > 0) {
          console.log('useViewCache: Cleaned up expired entries', { removedCount });
        }
        
        return newCache;
      });
    }, stableTtl.current / 2);

    return () => {
      console.log('useViewCache: Clearing cleanup interval');
      clearInterval(interval);
    };
  }, [isValidEntry]); // Only depend on isValidEntry, not ttl directly

  return {
    get,
    set,
    invalidate,
    clear,
    getCacheStats
  };
}
