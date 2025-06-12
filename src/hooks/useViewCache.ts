
import { useState, useEffect, useCallback } from 'react';

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

  const getCacheStats = useCallback(() => {
    const hits = cacheHits[cacheKey] || 0;
    const misses = cacheMisses[cacheKey] || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    return {
      hits,
      misses,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: cache.size
    };
  }, [cacheHits, cacheMisses, cacheKey, cache.size]);

  const isValidEntry = useCallback((entry: CacheEntry<T>) => {
    return Date.now() - entry.timestamp < ttl;
  }, [ttl]);

  const get = useCallback((key: string): T | null => {
    const fullKey = `${cacheKey}:${key}`;
    const entry = cache.get(fullKey);
    
    if (entry && isValidEntry(entry)) {
      setCacheHits(prev => ({
        ...prev,
        [cacheKey]: (prev[cacheKey] || 0) + 1
      }));
      return entry.data;
    }
    
    if (entry) {
      // Remove expired entry
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(fullKey);
        return newCache;
      });
    }
    
    setCacheMisses(prev => ({
      ...prev,
      [cacheKey]: (prev[cacheKey] || 0) + 1
    }));
    
    return null;
  }, [cache, cacheKey, isValidEntry]);

  const set = useCallback((key: string, data: T, version = 1) => {
    const fullKey = `${cacheKey}:${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version
    };
    
    setCache(prev => new Map(prev).set(fullKey, entry));
  }, [cacheKey]);

  const invalidate = useCallback((keyPattern?: string) => {
    if (keyPattern) {
      setCache(prev => {
        const newCache = new Map(prev);
        for (const key of newCache.keys()) {
          if (key.startsWith(`${cacheKey}:${keyPattern}`)) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
    } else {
      setCache(prev => {
        const newCache = new Map(prev);
        for (const key of newCache.keys()) {
          if (key.startsWith(`${cacheKey}:`)) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
    }
  }, [cacheKey]);

  const clear = useCallback(() => {
    setCache(new Map());
    setCacheHits({});
    setCacheMisses({});
  }, []);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCache(prev => {
        const newCache = new Map();
        for (const [key, entry] of prev.entries()) {
          if (isValidEntry(entry)) {
            newCache.set(key, entry);
          }
        }
        return newCache;
      });
    }, ttl / 2);

    return () => clearInterval(interval);
  }, [ttl, isValidEntry]);

  return {
    get,
    set,
    invalidate,
    clear,
    getCacheStats
  };
}
