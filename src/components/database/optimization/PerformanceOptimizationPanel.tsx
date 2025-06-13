import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Zap, 
  HardDrive, 
  Clock, 
  Target,
  AlertTriangle,
  CheckCircle,
  Play,
  Square
} from 'lucide-react';
import { usePerformanceOptimizer } from '@/hooks/usePerformanceOptimizer';
import { DatabaseField } from '@/types/database';

interface PerformanceOptimizationPanelProps {
  fields: DatabaseField[];
  totalRows: number;
  visibleRows: number;
  onOptimizationApplied?: (type: string) => void;
}

export function PerformanceOptimizationPanel({
  fields,
  totalRows,
  visibleRows,
  onOptimizationApplied
}: PerformanceOptimizationPanelProps) {
  const {
    analyzePerformance,
    startMetricsCollection,
    stopMetricsCollection,
    clearMetrics,
    getAverageMetrics,
    suggestions,
    isCollecting
  } = usePerformanceOptimizer();

  const averageMetrics = getAverageMetrics();

  useEffect(() => {
    // Simulate performance measurement on component mount
    const mockRenderTime = Math.random() * 150 + 50; // 50-200ms
    const mockQueryTime = Math.random() * 600 + 100; // 100-700ms
    const mockMemoryUsage = Math.random() * 80 * 1024 * 1024 + 20 * 1024 * 1024; // 20-100MB

    analyzePerformance(
      mockRenderTime,
      mockQueryTime,
      mockMemoryUsage,
      visibleRows,
      totalRows,
      fields
    );
  }, [analyzePerformance, fields, totalRows, visibleRows]);

  const handleStartCollection = () => {
    clearMetrics();
    startMetricsCollection();
  };

  const handleStopCollection = () => {
    stopMetricsCollection();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'virtualization': return <Zap className="h-4 w-4" />;
      case 'pagination': return <Target className="h-4 w-4" />;
      case 'lazy-loading': return <TrendingUp className="h-4 w-4" />;
      case 'indexing': return <HardDrive className="h-4 w-4" />;
      case 'caching': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Optimization
        </CardTitle>
        <CardDescription>
          Real-time performance analysis and optimization recommendations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Collection Controls */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleStartCollection}
            disabled={isCollecting}
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Monitoring
          </Button>
          
          <Button 
            onClick={handleStopCollection}
            disabled={!isCollecting}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Stop Monitoring
          </Button>

          {isCollecting && (
            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
              Collecting Metrics
            </Badge>
          )}
        </div>

        {/* Current Performance Metrics */}
        {averageMetrics && (
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Current Performance</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Render Time</span>
                  </div>
                  <div className="text-xl font-bold">
                    {averageMetrics.renderTime.toFixed(0)}ms
                  </div>
                  <Progress 
                    value={Math.min((averageMetrics.renderTime / 200) * 100, 100)} 
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Target: &lt;100ms
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Query Time</span>
                  </div>
                  <div className="text-xl font-bold">
                    {averageMetrics.queryTime.toFixed(0)}ms
                  </div>
                  <Progress 
                    value={Math.min((averageMetrics.queryTime / 1000) * 100, 100)} 
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Target: &lt;500ms
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Memory</span>
                  </div>
                  <div className="text-xl font-bold">
                    {(averageMetrics.memoryUsage / (1024 * 1024)).toFixed(1)}MB
                  </div>
                  <Progress 
                    value={Math.min((averageMetrics.memoryUsage / (100 * 1024 * 1024)) * 100, 100)} 
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Target: &lt;50MB
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Optimization Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <Separator />
            
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold">Optimization Suggestions</h4>
              <Badge variant="outline">
                {suggestions.length} recommendations
              </Badge>
            </div>

            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <Alert key={index} className="relative">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(suggestion.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{suggestion.description}</span>
                        <Badge 
                          variant="outline" 
                          className={getPriorityColor(suggestion.priority)}
                        >
                          {suggestion.priority}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div><strong>Impact:</strong> {suggestion.impact}</div>
                        <div><strong>Implementation:</strong> {suggestion.implementation}</div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onOptimizationApplied?.(suggestion.type)}
                        className="mt-2"
                      >
                        Apply Optimization
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Dataset Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="font-medium">Dataset Size</div>
            <div className="text-muted-foreground">
              {totalRows.toLocaleString()} total rows
            </div>
            <div className="text-muted-foreground">
              {visibleRows} visible rows
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">Field Complexity</div>
            <div className="text-muted-foreground">
              {fields.filter(f => f.type === 'formula').length} formulas
            </div>
            <div className="text-muted-foreground">
              {fields.filter(f => f.type === 'rollup').length} rollups
            </div>
            <div className="text-muted-foreground">
              {fields.filter(f => f.type === 'relation').length} relations
            </div>
          </div>
        </div>

        {/* Performance Targets */}
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Targets:</strong> Query &lt;200ms (local) / &lt;500ms (network), 
            Render &lt;100ms, Memory &lt;50MB for optimal user experience.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
