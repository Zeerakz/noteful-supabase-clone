
import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface UseViewCacheProps {
  cacheKey: string;
  ttl?: number;
}

export function useViewCache<T>({ cacheKey, ttl = 5 * 60 * 1000 }: UseViewCacheProps) {
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());
  const [cacheHits, setCacheHits] = useState<Record<string, number>>({});
  const [cacheMisses, setCacheMisses] = useState<Record<string, number>>({});

  // Stable refs to prevent recreating functions
  const cacheKeyRef = useRef(cacheKey);
  const ttlRef = useRef(ttl);
  
  // Only update when actually changed
  cacheKeyRef.current = cacheKey;
  ttlRef.current = ttl;

  const getCacheStats = useCallback(() => {
    const hits = cacheHits[cacheKeyRef.current] || 0;
    const misses = cacheMisses[cacheKeyRef.current] || 0;
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
    return Date.now() - entry.timestamp < ttlRef.current;
  }, []);

  const get = useCallback((key: string): T | null => {
    const fullKey = `${cacheKeyRef.current}:${key}`;
    const entry = cache.get(fullKey);
    
    if (entry && isValidEntry(entry)) {
      setCacheHits(prev => ({
        ...prev,
        [cacheKeyRef.current]: (prev[cacheKeyRef.current] || 0) + 1
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
      [cacheKeyRef.current]: (prev[cacheKeyRef.current] || 0) + 1
    }));
    
    return null;
  }, [cache, isValidEntry]);

  const set = useCallback((key: string, data: T, version = 1) => {
    const fullKey = `${cacheKeyRef.current}:${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version
    };
    
    setCache(prev => new Map(prev).set(fullKey, entry));
  }, []);

  const invalidate = useCallback((keyPattern?: string) => {
    setCache(prev => {
      const newCache = new Map(prev);
      for (const key of newCache.keys()) {
        if (keyPattern) {
          if (key.startsWith(`${cacheKeyRef.current}:${keyPattern}`)) {
            newCache.delete(key);
          }
        } else if (key.startsWith(`${cacheKeyRef.current}:`)) {
          newCache.delete(key);
        }
      }
      return newCache;
    });
  }, []);

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
        let removedCount = 0;
        
        for (const [key, entry] of prev.entries()) {
          if (Date.now() - entry.timestamp < ttlRef.current) {
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
    }, ttlRef.current / 2);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - setup once

  return {
    get,
    set,
    invalidate,
    clear,
    getCacheStats
  };
}
