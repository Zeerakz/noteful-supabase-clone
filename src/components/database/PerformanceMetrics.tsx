
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Clock, Database, RefreshCw } from 'lucide-react';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { useViewCache } from '@/hooks/useViewCache';

interface PerformanceMetricsProps {
  viewType: string;
  databaseId: string;
}

export function PerformanceMetrics({ viewType, databaseId }: PerformanceMetricsProps) {
  const { metrics, getAverageTime, getSlowQueries, getOptimizationSuggestions, clearMetrics } = usePerformanceMetrics();
  const cache = useViewCache({ cacheKey: `${viewType}-${databaseId}` });
  
  const cacheStats = cache.getCacheStats();
  const avgLoadTime = getAverageTime('page_load');
  const avgPropertyLoad = getAverageTime('property_load');
  const slowQueries = getSlowQueries(1000);
  const suggestions = getOptimizationSuggestions();

  const getPerformanceColor = (time: number) => {
    if (time < 500) return 'text-green-600';
    if (time < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceProgress = (time: number) => {
    return Math.min((time / 2000) * 100, 100);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
          <CardDescription className="text-xs">
            View optimization insights and cache statistics
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={clearMetrics}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Load Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Load Time</span>
              <span className={`text-xs font-medium ${getPerformanceColor(avgLoadTime)}`}>
                {avgLoadTime.toFixed(0)}ms
              </span>
            </div>
            <Progress value={getPerformanceProgress(avgLoadTime)} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Property Load</span>
              <span className={`text-xs font-medium ${getPerformanceColor(avgPropertyLoad)}`}>
                {avgPropertyLoad.toFixed(0)}ms
              </span>
            </div>
            <Progress value={getPerformanceProgress(avgPropertyLoad)} className="h-1" />
          </div>
        </div>

        {/* Cache Statistics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Hit Rate</div>
            <div className="text-sm font-medium">{cacheStats.hitRate}%</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Hits</div>
            <div className="text-sm font-medium text-green-600">{cacheStats.hits}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Misses</div>
            <div className="text-sm font-medium text-red-600">{cacheStats.misses}</div>
          </div>
        </div>

        {/* Slow Queries Warning */}
        {slowQueries.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-yellow-800">
              {slowQueries.length} slow queries detected
            </span>
          </div>
        )}

        {/* Optimization Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Suggestions</div>
            <div className="space-y-1">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-blue-50 border border-blue-200">
                  <TrendingUp className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-blue-800">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {metrics.length} metrics
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Database className="h-3 w-3 mr-1" />
            Cache: {cacheStats.cacheSize}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
