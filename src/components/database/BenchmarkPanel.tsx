
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Trash2, 
  TrendingUp, 
  Clock, 
  Database, 
  Memory, 
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';

interface BenchmarkConfig {
  rowCount: number;
  relationCount: number;
  rollupCount: number;
  formulaCount: number;
  nestedFormulaDepth: number;
}

export function BenchmarkPanel() {
  const {
    runBenchmark,
    isGenerating,
    benchmarkResults,
    setBenchmarkResults,
    cleanupTestData,
    testDatabaseId
  } = useBenchmarkData();

  const [config, setConfig] = useState<BenchmarkConfig>({
    rowCount: 50000,
    relationCount: 20,
    rollupCount: 10,
    formulaCount: 5,
    nestedFormulaDepth: 3
  });

  const handleRunBenchmark = async () => {
    try {
      setBenchmarkResults(null);
      const results = await runBenchmark(config);
      setBenchmarkResults(results);
    } catch (error) {
      console.error('Benchmark failed:', error);
    }
  };

  const handleCleanup = async () => {
    await cleanupTestData();
    setBenchmarkResults(null);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'F': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceIcon = (grade: string) => {
    if (grade === 'A' || grade === 'B') {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Database Performance Benchmark
        </CardTitle>
        <CardDescription>
          Test performance with large datasets: 50k rows, 20 relations, 10 rollups, 5 nested formulas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rowCount">Row Count</Label>
            <Input
              id="rowCount"
              type="number"
              value={config.rowCount}
              onChange={(e) => setConfig(prev => ({ ...prev, rowCount: parseInt(e.target.value) || 0 }))}
              disabled={isGenerating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="relationCount">Relations</Label>
            <Input
              id="relationCount"
              type="number"
              value={config.relationCount}
              onChange={(e) => setConfig(prev => ({ ...prev, relationCount: parseInt(e.target.value) || 0 }))}
              disabled={isGenerating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rollupCount">Rollups</Label>
            <Input
              id="rollupCount"
              type="number"
              value={config.rollupCount}
              onChange={(e) => setConfig(prev => ({ ...prev, rollupCount: parseInt(e.target.value) || 0 }))}
              disabled={isGenerating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="formulaCount">Formulas</Label>
            <Input
              id="formulaCount"
              type="number"
              value={config.formulaCount}
              onChange={(e) => setConfig(prev => ({ ...prev, formulaCount: parseInt(e.target.value) || 0 }))}
              disabled={isGenerating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nestedFormulaDepth">Formula Depth</Label>
            <Input
              id="nestedFormulaDepth"
              type="number"
              value={config.nestedFormulaDepth}
              onChange={(e) => setConfig(prev => ({ ...prev, nestedFormulaDepth: parseInt(e.target.value) || 1 }))}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleRunBenchmark} 
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isGenerating ? 'Running Benchmark...' : 'Run Benchmark'}
          </Button>
          
          {testDatabaseId && (
            <Button 
              variant="outline" 
              onClick={handleCleanup}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Cleanup Test Data
            </Button>
          )}
        </div>

        {/* Progress Indicator */}
        {isGenerating && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Generating test data and measuring performance... This may take several minutes.
            </AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {benchmarkResults && (
          <div className="space-y-6">
            <Separator />
            
            {/* Performance Grade */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Performance Results</h3>
              <Badge 
                variant="outline" 
                className={`${getGradeColor(benchmarkResults.performanceGrade)} flex items-center gap-1`}
              >
                {getPerformanceIcon(benchmarkResults.performanceGrade)}
                Grade: {benchmarkResults.performanceGrade}
              </Badge>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Query Time</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {benchmarkResults.queryTime.toFixed(0)}ms
                  </div>
                  <Progress 
                    value={Math.min((benchmarkResults.queryTime / 500) * 100, 100)} 
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Target: &lt;200ms local, &lt;500ms network
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Render Time</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {benchmarkResults.renderTime.toFixed(0)}ms
                  </div>
                  <Progress 
                    value={Math.min((benchmarkResults.renderTime / 100) * 100, 100)} 
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
                    <Memory className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {(benchmarkResults.memoryUsage / (1024 * 1024)).toFixed(1)}MB
                  </div>
                  <Progress 
                    value={Math.min((benchmarkResults.memoryUsage / (100 * 1024 * 1024)) * 100, 100)} 
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Target: &lt;100MB
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Total Time</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {(benchmarkResults.totalTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Including data generation
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="text-md font-semibold">Optimization Recommendations</h4>
              <div className="space-y-2">
                {benchmarkResults.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium">Generation Metrics</h5>
                <div className="space-y-1 text-muted-foreground">
                  <div>Data Generation: {(benchmarkResults.dataGenerationTime / 1000).toFixed(1)}s</div>
                  <div>Rows Generated: {config.rowCount.toLocaleString()}</div>
                  <div>Relations: {config.relationCount}</div>
                  <div>Rollups: {config.rollupCount}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium">Performance Targets</h5>
                <div className="space-y-1 text-muted-foreground">
                  <div>Query (Local): &lt;200ms</div>
                  <div>Query (Network): &lt;500ms</div>
                  <div>Render: &lt;100ms</div>
                  <div>Memory: &lt;100MB</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
