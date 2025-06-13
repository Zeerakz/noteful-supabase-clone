
import React from 'react';
import { BenchmarkPanel } from '@/components/database/BenchmarkPanel';
import { PerformanceOptimizationPanel } from '@/components/database/optimization/PerformanceOptimizationPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Zap, Target } from 'lucide-react';

export function BenchmarkPage() {
  // Mock data for demonstration
  const mockFields = [
    { id: '1', name: 'Title', type: 'text', database_id: 'test', pos: 0, created_by: 'test', created_at: '', updated_at: '' },
    { id: '2', name: 'Status', type: 'select', database_id: 'test', pos: 1, created_by: 'test', created_at: '', updated_at: '' },
    { id: '3', name: 'Due Date', type: 'date', database_id: 'test', pos: 2, created_by: 'test', created_at: '', updated_at: '' },
    { id: '4', name: 'Priority', type: 'formula', database_id: 'test', pos: 3, created_by: 'test', created_at: '', updated_at: '' },
    { id: '5', name: 'Related Tasks', type: 'relation', database_id: 'test', pos: 4, created_by: 'test', created_at: '', updated_at: '' },
    { id: '6', name: 'Total Count', type: 'rollup', database_id: 'test', pos: 5, created_by: 'test', created_at: '', updated_at: '' },
  ];

  const handleOptimizationApplied = (type: string) => {
    console.log(`Applied optimization: ${type}`);
    // Here you would implement the actual optimization
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Database Performance Benchmark</h1>
        <p className="text-muted-foreground">
          Test and optimize performance for large-scale datasets with complex relationships and computations.
        </p>
      </div>

      <Tabs defaultValue="benchmark" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="benchmark" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Benchmark Test
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Live Optimization
          </TabsTrigger>
          <TabsTrigger value="targets" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance Targets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="benchmark" className="space-y-6">
          <BenchmarkPanel />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <PerformanceOptimizationPanel
            fields={mockFields}
            totalRows={50000}
            visibleRows={50}
            onOptimizationApplied={handleOptimizationApplied}
          />
        </TabsContent>

        <TabsContent value="targets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Targets
                </CardTitle>
                <CardDescription>
                  Budgeted performance thresholds for optimal user experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Local Query Time</span>
                    <span className="text-sm text-muted-foreground">&lt; 200ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Network Query Time</span>
                    <span className="text-sm text-muted-foreground">&lt; 500ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Render Time</span>
                    <span className="text-sm text-muted-foreground">&lt; 100ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">&lt; 50MB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Scenario</CardTitle>
                <CardDescription>
                  Large dataset benchmark configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Rows</span>
                    <span className="text-sm text-muted-foreground">50,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Relations</span>
                    <span className="text-sm text-muted-foreground">20</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Rollups</span>
                    <span className="text-sm text-muted-foreground">10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Nested Formulas</span>
                    <span className="text-sm text-muted-foreground">5 (depth: 3)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
