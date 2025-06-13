
import { useCallback, useRef, useState } from 'react';
import { DatabaseField } from '@/types/database';

interface OptimizationMetrics {
  renderTime: number;
  queryTime: number;
  memoryUsage: number;
  itemsVisible: number;
  totalItems: number;
}

interface OptimizationSuggestion {
  type: 'virtualization' | 'pagination' | 'lazy-loading' | 'indexing' | 'caching';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
}

export function usePerformanceOptimizer() {
  const [metrics, setMetrics] = useState<OptimizationMetrics[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const metricsCollectionRef = useRef<boolean>(false);

  const collectMetrics = useCallback((metric: OptimizationMetrics) => {
    setMetrics(prev => [...prev.slice(-19), metric]); // Keep last 20 measurements
  }, []);

  const measureRenderPerformance = useCallback((callback: () => void): number => {
    const startTime = performance.now();
    callback();
    return performance.now() - startTime;
  }, []);

  const generateOptimizationSuggestions = useCallback((
    currentMetrics: OptimizationMetrics,
    fields: DatabaseField[],
    totalRows: number
  ): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze render performance
    if (currentMetrics.renderTime > 100) {
      suggestions.push({
        type: 'virtualization',
        priority: 'high',
        description: 'Implement virtual scrolling for large datasets',
        impact: 'Reduces render time by 60-80% for large lists',
        implementation: 'Use react-virtual or react-window for virtualized rendering'
      });
    }

    // Analyze query performance
    if (currentMetrics.queryTime > 500) {
      suggestions.push({
        type: 'pagination',
        priority: 'high',
        description: 'Implement server-side pagination',
        impact: 'Reduces initial load time and memory usage',
        implementation: 'Load data in chunks of 50-100 items per page'
      });

      suggestions.push({
        type: 'indexing',
        priority: 'high',
        description: 'Add database indexes for frequently queried fields',
        impact: 'Improves query performance by 10-100x',
        implementation: 'Create indexes on filter and sort columns'
      });
    }

    // Analyze memory usage
    if (currentMetrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      suggestions.push({
        type: 'lazy-loading',
        priority: 'medium',
        description: 'Implement lazy loading for non-visible data',
        impact: 'Reduces memory footprint by 40-60%',
        implementation: 'Load data on-demand when scrolled into view'
      });
    }

    // Analyze complex fields
    const complexFields = fields.filter(f => 
      f.type === 'formula' || f.type === 'rollup' || f.type === 'relation'
    );

    if (complexFields.length > 5) {
      suggestions.push({
        type: 'caching',
        priority: 'medium',
        description: 'Cache computed field values',
        impact: 'Reduces recalculation overhead by 70-90%',
        implementation: 'Store computed values in database with invalidation strategy'
      });
    }

    // Analyze dataset size
    if (totalRows > 10000) {
      suggestions.push({
        type: 'virtualization',
        priority: 'high',
        description: 'Enable virtual scrolling for table views',
        impact: 'Maintains consistent performance regardless of dataset size',
        implementation: 'Render only visible rows plus small buffer'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, []);

  const analyzePerformance = useCallback((
    renderTime: number,
    queryTime: number,
    memoryUsage: number,
    visibleItems: number,
    totalItems: number,
    fields: DatabaseField[]
  ) => {
    const currentMetrics: OptimizationMetrics = {
      renderTime,
      queryTime,
      memoryUsage,
      itemsVisible: visibleItems,
      totalItems
    };

    collectMetrics(currentMetrics);
    
    const newSuggestions = generateOptimizationSuggestions(
      currentMetrics, 
      fields, 
      totalItems
    );
    
    setSuggestions(newSuggestions);

    return {
      metrics: currentMetrics,
      suggestions: newSuggestions,
      performanceGrade: calculatePerformanceGrade(currentMetrics),
      optimizationPotential: calculateOptimizationPotential(newSuggestions)
    };
  }, [collectMetrics, generateOptimizationSuggestions]);

  const calculatePerformanceGrade = (metrics: OptimizationMetrics): 'A' | 'B' | 'C' | 'D' | 'F' => {
    let score = 100;

    // Render time scoring (target: <100ms)
    if (metrics.renderTime > 200) score -= 30;
    else if (metrics.renderTime > 100) score -= 15;

    // Query time scoring (target: <500ms)
    if (metrics.queryTime > 1000) score -= 30;
    else if (metrics.queryTime > 500) score -= 15;

    // Memory usage scoring (target: <50MB)
    if (metrics.memoryUsage > 100 * 1024 * 1024) score -= 20;
    else if (metrics.memoryUsage > 50 * 1024 * 1024) score -= 10;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const calculateOptimizationPotential = (suggestions: OptimizationSuggestion[]): number => {
    const highPriorityCount = suggestions.filter(s => s.priority === 'high').length;
    const mediumPriorityCount = suggestions.filter(s => s.priority === 'medium').length;
    
    return (highPriorityCount * 3) + (mediumPriorityCount * 2) + suggestions.length;
  };

  const startMetricsCollection = useCallback(() => {
    metricsCollectionRef.current = true;
  }, []);

  const stopMetricsCollection = useCallback(() => {
    metricsCollectionRef.current = false;
  }, []);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    setSuggestions([]);
  }, []);

  const getAverageMetrics = useCallback((): OptimizationMetrics | null => {
    if (metrics.length === 0) return null;

    const totals = metrics.reduce((acc, metric) => ({
      renderTime: acc.renderTime + metric.renderTime,
      queryTime: acc.queryTime + metric.queryTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      itemsVisible: acc.itemsVisible + metric.itemsVisible,
      totalItems: acc.totalItems + metric.totalItems
    }), {
      renderTime: 0,
      queryTime: 0,
      memoryUsage: 0,
      itemsVisible: 0,
      totalItems: 0
    });

    return {
      renderTime: totals.renderTime / metrics.length,
      queryTime: totals.queryTime / metrics.length,
      memoryUsage: totals.memoryUsage / metrics.length,
      itemsVisible: totals.itemsVisible / metrics.length,
      totalItems: totals.totalItems / metrics.length
    };
  }, [metrics]);

  return {
    collectMetrics,
    measureRenderPerformance,
    analyzePerformance,
    startMetricsCollection,
    stopMetricsCollection,
    clearMetrics,
    getAverageMetrics,
    metrics,
    suggestions,
    isCollecting: metricsCollectionRef.current
  };
}
