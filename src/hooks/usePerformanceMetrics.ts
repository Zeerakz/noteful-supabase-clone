
import { useState, useCallback, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const timers = useRef<Map<string, number>>(new Map());
  const metadataStore = useRef<Map<string, Record<string, any>>>(new Map());

  const startTimer = useCallback((name: string, metadata?: Record<string, any>) => {
    timers.current.set(name, performance.now());
    if (metadata) {
      metadataStore.current.set(name, metadata);
    }
  }, []);

  const endTimer = useCallback((name: string) => {
    const startTime = timers.current.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      const metadata = metadataStore.current.get(name);
      
      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: Date.now(),
        metadata
      };

      setMetrics(prev => [...prev.slice(-49), metric]); // Keep last 50 metrics
      timers.current.delete(name);
      metadataStore.current.delete(name);
      
      return duration;
    }
    return 0;
  }, []);

  const getAverageTime = useCallback((metricName: string) => {
    const relevantMetrics = metrics.filter(m => m.name === metricName);
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / relevantMetrics.length;
  }, [metrics]);

  const getSlowQueries = useCallback((threshold = 1000) => {
    return metrics.filter(m => m.duration > threshold);
  }, [metrics]);

  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    const avgLoadTime = getAverageTime('page_load');
    const avgPropertyLoad = getAverageTime('property_load');
    const slowQueries = getSlowQueries(1000);

    if (avgLoadTime > 2000) {
      suggestions.push('Consider implementing pagination - average load time is over 2 seconds');
    }

    if (avgPropertyLoad > 500) {
      suggestions.push('Property loading is slow - consider lazy loading non-visible properties');
    }

    if (slowQueries.length > 5) {
      suggestions.push(`${slowQueries.length} slow queries detected - consider adding database indexes`);
    }

    const recentMetrics = metrics.slice(-10);
    const cacheMisses = recentMetrics.filter(m => m.name.includes('cache_miss')).length;
    if (cacheMisses > 7) {
      suggestions.push('High cache miss ratio - consider adjusting cache TTL or warming strategy');
    }

    return suggestions;
  }, [getAverageTime, getSlowQueries, metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    timers.current.clear();
    metadataStore.current.clear();
  }, []);

  return {
    metrics,
    startTimer,
    endTimer,
    getAverageTime,
    getSlowQueries,
    getOptimizationSuggestions,
    clearMetrics
  };
}
