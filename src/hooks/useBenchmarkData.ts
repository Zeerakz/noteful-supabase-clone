
import { useState, useCallback } from 'react';
import { DatabaseField } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

interface BenchmarkConfig {
  rowCount: number;
  relationCount: number;
  rollupCount: number;
  formulaCount: number;
  nestedFormulaDepth: number;
}

interface BenchmarkResults {
  dataGenerationTime: number;
  queryTime: number;
  renderTime: number;
  memoryUsage: number;
  totalTime: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  rowCount: 50000,
  relationCount: 20,
  rollupCount: 10,
  formulaCount: 5,
  nestedFormulaDepth: 3
};

export function useBenchmarkData() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResults | null>(null);
  const [testDatabaseId, setTestDatabaseId] = useState<string | null>(null);

  const generateTestFields = useCallback((config: BenchmarkConfig): DatabaseField[] => {
    const fields: DatabaseField[] = [];
    let fieldIndex = 0;

    // Generate basic fields
    fields.push({
      id: `field_${fieldIndex++}`,
      name: 'Title',
      type: 'text',
      database_id: 'test',
      pos: 0,
      created_by: 'benchmark',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Generate text fields
    for (let i = 0; i < 5; i++) {
      fields.push({
        id: `field_${fieldIndex++}`,
        name: `Text Field ${i + 1}`,
        type: 'text',
        database_id: 'test',
        pos: fieldIndex,
        created_by: 'benchmark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Generate number fields
    for (let i = 0; i < 5; i++) {
      fields.push({
        id: `field_${fieldIndex++}`,
        name: `Number Field ${i + 1}`,
        type: 'number',
        database_id: 'test',
        pos: fieldIndex,
        created_by: 'benchmark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Generate date fields
    for (let i = 0; i < 3; i++) {
      fields.push({
        id: `field_${fieldIndex++}`,
        name: `Date Field ${i + 1}`,
        type: 'date',
        database_id: 'test',
        pos: fieldIndex,
        created_by: 'benchmark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Generate select fields
    for (let i = 0; i < 5; i++) {
      fields.push({
        id: `field_${fieldIndex++}`,
        name: `Select Field ${i + 1}`,
        type: 'select',
        database_id: 'test',
        pos: fieldIndex,
        created_by: 'benchmark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          options: [
            { id: 'opt1', name: 'Option 1', color: 'blue' },
            { id: 'opt2', name: 'Option 2', color: 'green' },
            { id: 'opt3', name: 'Option 3', color: 'red' },
          ]
        }
      });
    }

    // Generate relation fields
    for (let i = 0; i < config.relationCount; i++) {
      fields.push({
        id: `relation_${i}`,
        name: `Relation ${i + 1}`,
        type: 'relation',
        database_id: 'test',
        pos: fieldIndex++,
        created_by: 'benchmark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          target_database_id: `target_db_${i}`,
          display_property: 'title',
          allow_multiple: true
        }
      });
    }

    // Generate rollup fields
    for (let i = 0; i < config.rollupCount; i++) {
      const relationFieldId = `relation_${i % config.relationCount}`;
      fields.push({
        id: `rollup_${i}`,
        name: `Rollup ${i + 1}`,
        type: 'rollup',
        database_id: 'test',
        pos: fieldIndex++,
        created_by: 'benchmark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          relation_field_id: relationFieldId,
          rollup_property: 'count',
          aggregation: i % 2 === 0 ? 'sum' : 'count'
        }
      });
    }

    // Generate formula fields with nesting
    for (let i = 0; i < config.formulaCount; i++) {
      const formula = generateNestedFormula(i, config.nestedFormulaDepth, fields);
      fields.push({
        id: `formula_${i}`,
        name: `Formula ${i + 1}`,
        type: 'formula',
        database_id: 'test',
        pos: fieldIndex++,
        created_by: 'benchmark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          formula,
          return_type: 'number'
        }
      });
    }

    return fields;
  }, []);

  const generateNestedFormula = (index: number, depth: number, fields: DatabaseField[]): string => {
    const numberFields = fields.filter(f => f.type === 'number');
    if (numberFields.length === 0) return '1';

    let formula = `prop("${numberFields[0]?.id || 'field_1'}")`;
    
    for (let i = 1; i < depth && i < numberFields.length; i++) {
      const operator = i % 2 === 0 ? '+' : '*';
      formula = `${formula} ${operator} prop("${numberFields[i].id}")`;
    }

    // Add conditional logic for complexity
    if (depth > 2) {
      formula = `if(${formula} > 100, ${formula} * 2, ${formula})`;
    }

    return formula;
  };

  const generateTestData = useCallback(async (
    databaseId: string, 
    fields: DatabaseField[], 
    rowCount: number
  ): Promise<number> => {
    const startTime = performance.now();
    const batchSize = 1000;
    const batches = Math.ceil(rowCount / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchStartTime = performance.now();
      const currentBatchSize = Math.min(batchSize, rowCount - (batch * batchSize));
      const pages = [];
      const properties = [];

      // Generate pages for this batch
      for (let i = 0; i < currentBatchSize; i++) {
        const pageIndex = (batch * batchSize) + i;
        const pageId = `test_page_${pageIndex}`;
        
        pages.push({
          id: pageId,
          title: `Test Page ${pageIndex + 1}`,
          database_id: databaseId,
          workspace_id: 'test_workspace',
          created_by: 'benchmark',
          order_index: pageIndex
        });

        // Generate properties for each field
        fields.forEach(field => {
          if (field.type === 'text') {
            properties.push({
              page_id: pageId,
              field_id: field.id,
              value: `Sample text ${pageIndex} for ${field.name}`,
              created_by: 'benchmark'
            });
          } else if (field.type === 'number') {
            properties.push({
              page_id: pageId,
              field_id: field.id,
              value: (Math.random() * 1000).toFixed(2),
              created_by: 'benchmark'
            });
          } else if (field.type === 'date') {
            const randomDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
            properties.push({
              page_id: pageId,
              field_id: field.id,
              value: randomDate.toISOString().split('T')[0],
              created_by: 'benchmark'
            });
          } else if (field.type === 'select') {
            const options = field.settings?.options || [];
            const randomOption = options[Math.floor(Math.random() * options.length)];
            properties.push({
              page_id: pageId,
              field_id: field.id,
              value: randomOption?.id || 'opt1',
              created_by: 'benchmark'
            });
          } else if (field.type === 'relation') {
            // Generate some random relation IDs
            const relationCount = Math.floor(Math.random() * 3) + 1;
            const relationIds = Array.from({length: relationCount}, (_, i) => `related_${pageIndex}_${i}`);
            properties.push({
              page_id: pageId,
              field_id: field.id,
              value: relationIds.join(','),
              created_by: 'benchmark'
            });
          }
        });
      }

      // Insert batch of pages
      try {
        const { error: pagesError } = await supabase
          .from('pages')
          .insert(pages);

        if (pagesError) {
          console.error(`Error inserting pages batch ${batch}:`, pagesError);
          continue;
        }

        // Insert batch of properties
        const { error: propertiesError } = await supabase
          .from('page_properties')
          .insert(properties);

        if (propertiesError) {
          console.error(`Error inserting properties batch ${batch}:`, propertiesError);
        }

        const batchTime = performance.now() - batchStartTime;
        console.log(`Batch ${batch + 1}/${batches} completed in ${batchTime.toFixed(2)}ms`);

      } catch (error) {
        console.error(`Error in batch ${batch}:`, error);
      }
    }

    return performance.now() - startTime;
  }, []);

  const runBenchmark = useCallback(async (
    config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG
  ): Promise<BenchmarkResults> => {
    setIsGenerating(true);
    const startTime = performance.now();
    let memoryBefore = 0;
    let memoryAfter = 0;

    try {
      // Measure initial memory
      if ('memory' in performance) {
        memoryBefore = (performance as any).memory.usedJSHeapSize;
      }

      // Step 1: Generate test database and fields
      const testDbId = `benchmark_db_${Date.now()}`;
      setTestDatabaseId(testDbId);

      console.log('Generating test fields...');
      const fields = generateTestFields(config);

      // Step 2: Generate test data
      console.log(`Generating ${config.rowCount} test records...`);
      const dataGenerationTime = await generateTestData(testDbId, fields, config.rowCount);

      // Step 3: Measure query performance
      console.log('Measuring query performance...');
      const queryStartTime = performance.now();
      
      const { data: pages, error } = await supabase
        .from('pages')
        .select(`
          *,
          page_properties (
            field_id,
            value,
            computed_value
          )
        `)
        .eq('database_id', testDbId)
        .limit(1000); // Test with first 1000 rows for query performance

      const queryTime = performance.now() - queryStartTime;

      if (error) {
        throw new Error(`Query error: ${error.message}`);
      }

      // Step 4: Measure render performance (simulated)
      console.log('Measuring render performance...');
      const renderStartTime = performance.now();
      
      // Simulate data processing that would happen during render
      const processedData = pages?.map(page => {
        const properties: Record<string, string> = {};
        if (page.page_properties) {
          page.page_properties.forEach((prop: any) => {
            properties[prop.field_id] = prop.value || prop.computed_value || '';
          });
        }
        return { ...page, properties };
      }) || [];

      const renderTime = performance.now() - renderStartTime;

      // Measure final memory
      if ('memory' in performance) {
        memoryAfter = (performance as any).memory.usedJSHeapSize;
      }

      const totalTime = performance.now() - startTime;
      const memoryUsage = memoryAfter - memoryBefore;

      // Generate performance grade and recommendations
      const results = analyzePerformance({
        dataGenerationTime,
        queryTime,
        renderTime,
        memoryUsage,
        totalTime,
        config,
        processedRowCount: processedData.length
      });

      console.log('Benchmark completed:', results);
      return results;

    } catch (error) {
      console.error('Benchmark failed:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [generateTestFields, generateTestData]);

  const analyzePerformance = (metrics: {
    dataGenerationTime: number;
    queryTime: number;
    renderTime: number;
    memoryUsage: number;
    totalTime: number;
    config: BenchmarkConfig;
    processedRowCount: number;
  }): BenchmarkResults => {
    const { queryTime, renderTime, memoryUsage, config } = metrics;
    const recommendations: string[] = [];
    let performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';

    // Analyze query performance (target: <200ms local, <500ms network)
    if (queryTime > 500) {
      performanceGrade = 'F';
      recommendations.push('Query time exceeds 500ms - implement pagination and indexing');
      recommendations.push('Consider using virtual scrolling for large datasets');
      recommendations.push('Add database indexes on frequently queried fields');
    } else if (queryTime > 200) {
      performanceGrade = performanceGrade === 'A' ? 'C' : performanceGrade;
      recommendations.push('Query time exceeds 200ms - optimize with selective field loading');
      recommendations.push('Implement lazy loading for related data');
    }

    // Analyze render performance
    if (renderTime > 100) {
      performanceGrade = performanceGrade === 'A' ? 'B' : performanceGrade;
      recommendations.push('Render time is high - implement virtualization');
      recommendations.push('Use React.memo for expensive components');
    }

    // Analyze memory usage
    if (memoryUsage > 100 * 1024 * 1024) { // 100MB
      performanceGrade = performanceGrade === 'A' ? 'C' : performanceGrade;
      recommendations.push('High memory usage detected - implement data cleanup');
      recommendations.push('Consider using pagination to reduce memory footprint');
    }

    // Analyze complexity
    if (config.rollupCount > 5) {
      recommendations.push('High rollup count - consider caching computed values');
    }

    if (config.relationCount > 10) {
      recommendations.push('Many relations detected - optimize with selective loading');
    }

    // Add optimization recommendations
    if (recommendations.length === 0) {
      recommendations.push('Performance is within target parameters');
      recommendations.push('Consider implementing progressive loading for better UX');
    } else {
      recommendations.push('Implement incremental loading for better perceived performance');
      recommendations.push('Add loading states and skeleton screens');
    }

    return {
      ...metrics,
      performanceGrade,
      recommendations
    };
  };

  const cleanupTestData = useCallback(async () => {
    if (!testDatabaseId) return;

    try {
      // First, get all page IDs for this database
      const { data: pages } = await supabase
        .from('pages')
        .select('id')
        .eq('database_id', testDatabaseId);

      if (pages && pages.length > 0) {
        const pageIds = pages.map(page => page.id);
        
        // Delete page properties for these pages
        await supabase
          .from('page_properties')
          .delete()
          .in('page_id', pageIds);
      }

      // Delete pages
      await supabase
        .from('pages')
        .delete()
        .eq('database_id', testDatabaseId);

      console.log('Test data cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  }, [testDatabaseId]);

  return {
    runBenchmark,
    isGenerating,
    benchmarkResults,
    setBenchmarkResults,
    cleanupTestData,
    testDatabaseId
  };
}
