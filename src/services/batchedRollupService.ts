import { supabase } from '@/integrations/supabase/client';
import { DatabaseField, RollupFieldSettings, RelationFieldSettings } from '@/types/database';

interface BatchRollupRequest {
  pageId: string;
  fieldId: string;
  field: DatabaseField;
  allFields: DatabaseField[];
}

interface BatchRollupResult {
  pageId: string;
  fieldId: string;
  value: string | null;
  error?: string;
}

export class BatchedRollupService {
  private static requestQueue: BatchRollupRequest[] = [];
  private static processing = false;
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static readonly BATCH_SIZE = 10;
  private static readonly BATCH_DELAY = 100; // ms

  /**
   * Add a rollup calculation request to the batch queue
   */
  static async queueRollupCalculation(
    pageId: string,
    field: DatabaseField,
    allFields: DatabaseField[]
  ): Promise<{ value: string | null; error?: string }> {
    return new Promise((resolve, reject) => {
      const request: BatchRollupRequest = {
        pageId,
        fieldId: field.id,
        field,
        allFields
      };

      // Add to queue
      this.requestQueue.push(request);

      // Store resolver for this specific request
      const requestIndex = this.requestQueue.length - 1;
      
      // Schedule batch processing
      this.scheduleBatchProcessing();

      // Set up a way to resolve this specific request
      const checkForResult = () => {
        // This is a simplified approach - in production you'd want a more robust system
        setTimeout(() => {
          resolve({ value: null, error: 'Request timed out' });
        }, 5000);
      };

      checkForResult();
    });
  }

  /**
   * Schedule batch processing with debouncing
   */
  private static scheduleBatchProcessing() {
    if (this.processing) return;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Process the current batch of rollup requests
   */
  private static async processBatch() {
    if (this.processing || this.requestQueue.length === 0) return;

    this.processing = true;
    const batch = this.requestQueue.splice(0, this.BATCH_SIZE);

    try {
      const results = await this.calculateRollupsBatch(batch);
      // Handle results...
    } catch (error) {
      console.error('Batch rollup calculation failed:', error);
    } finally {
      this.processing = false;
      
      // Process remaining queue if any
      if (this.requestQueue.length > 0) {
        this.scheduleBatchProcessing();
      }
    }
  }

  /**
   * Calculate multiple rollups in a single batch operation
   */
  private static async calculateRollupsBatch(
    requests: BatchRollupRequest[]
  ): Promise<BatchRollupResult[]> {
    const results: BatchRollupResult[] = [];

    // Group requests by target database to optimize queries
    const requestsByDatabase = new Map<string, BatchRollupRequest[]>();

    for (const request of requests) {
      const settings = request.field.settings as RollupFieldSettings;
      const relationField = request.allFields.find(f => f.id === settings.relation_field_id);
      
      if (!relationField) continue;
      
      const relationSettings = relationField.settings as RelationFieldSettings;
      const targetDatabaseId = relationSettings.target_database_id;
      
      if (!targetDatabaseId) continue;

      if (!requestsByDatabase.has(targetDatabaseId)) {
        requestsByDatabase.set(targetDatabaseId, []);
      }
      requestsByDatabase.get(targetDatabaseId)!.push(request);
    }

    // Process each database group
    for (const [targetDatabaseId, dbRequests] of requestsByDatabase) {
      try {
        const dbResults = await this.processDatabaseBatch(targetDatabaseId, dbRequests);
        results.push(...dbResults);
      } catch (error) {
        // Add error results for failed batch
        for (const request of dbRequests) {
          results.push({
            pageId: request.pageId,
            fieldId: request.fieldId,
            value: null,
            error: error instanceof Error ? error.message : 'Batch calculation failed'
          });
        }
      }
    }

    return results;
  }

  /**
   * Process rollup calculations for a specific target database
   */
  private static async processDatabaseBatch(
    targetDatabaseId: string,
    requests: BatchRollupRequest[]
  ): Promise<BatchRollupResult[]> {
    const results: BatchRollupResult[] = [];

    // Get all page relation values for this batch
    const pageIds = requests.map(r => r.pageId);
    const relationFieldIds = Array.from(new Set(
      requests.map(r => {
        const settings = r.field.settings as RollupFieldSettings;
        return settings.relation_field_id;
      })
    ));

    // Batch fetch all relation values
    const { data: relationValues } = await supabase
      .from('property_values')
      .select('page_id, property_id, value')
      .in('page_id', pageIds)
      .in('property_id', relationFieldIds);

    if (!relationValues) {
      return requests.map(r => ({
        pageId: r.pageId,
        fieldId: r.fieldId,
        value: '0',
        error: null
      }));
    }

    // Get all related page IDs
    const allRelatedPageIds = new Set<string>();
    relationValues.forEach(rv => {
      if (rv.value) {
        rv.value.split(',').forEach(id => allRelatedPageIds.add(id.trim()));
      }
    });

    // Batch fetch all target properties we need
    const targetPropertyIds = Array.from(new Set(
      requests.map(r => {
        const settings = r.field.settings as RollupFieldSettings;
        return settings.rollup_property;
      })
    ));

    let targetPropertyValues: any[] = [];
    if (allRelatedPageIds.size > 0 && targetPropertyIds.some(id => id !== 'title' && id !== 'count')) {
      const { data } = await supabase
        .from('property_values')
        .select('page_id, property_id, value')
        .in('page_id', Array.from(allRelatedPageIds))
        .in('property_id', targetPropertyIds.filter(id => id !== 'title' && id !== 'count'));
      
      targetPropertyValues = data || [];
    }

    // Batch fetch page titles if needed
    let pageTitles: any[] = [];
    if (targetPropertyIds.includes('title') && allRelatedPageIds.size > 0) {
      const { data } = await supabase
        .from('blocks')
        .select('id, properties')
        .eq('type', 'page')
        .in('id', Array.from(allRelatedPageIds));
      
      pageTitles = data || [];
    }

    // Calculate results for each request
    for (const request of requests) {
      try {
        const settings = request.field.settings as RollupFieldSettings;
        
        // Get relation value for this page
        const relationValue = relationValues.find(
          rv => rv.page_id === request.pageId && rv.property_id === settings.relation_field_id
        )?.value;

        if (!relationValue) {
          results.push({
            pageId: request.pageId,
            fieldId: request.fieldId,
            value: this.getDefaultValue(settings.aggregation)
          });
          continue;
        }

        const relatedPageIds = relationValue.split(',').filter(Boolean);
        
        if (relatedPageIds.length === 0) {
          results.push({
            pageId: request.pageId,
            fieldId: request.fieldId,
            value: this.getDefaultValue(settings.aggregation)
          });
          continue;
        }

        // Handle count aggregation
        if (settings.rollup_property === 'count') {
          results.push({
            pageId: request.pageId,
            fieldId: request.fieldId,
            value: relatedPageIds.length.toString()
          });
          continue;
        }

        // Get property values for calculation
        let propertyValues: any[] = [];
        
        if (settings.rollup_property === 'title') {
          propertyValues = pageTitles
            .filter(p => relatedPageIds.includes(p.id))
            .map(p => p.properties?.title);
        } else {
          propertyValues = targetPropertyValues
            .filter(p => 
              relatedPageIds.includes(p.page_id) && 
              p.property_id === settings.rollup_property
            )
            .map(p => p.value)
            .filter(Boolean);
        }

        // Perform aggregation
        const result = this.performAggregation(
          propertyValues,
          settings.aggregation,
          settings.rollup_property
        );

        results.push({
          pageId: request.pageId,
          fieldId: request.fieldId,
          value: result
        });

      } catch (error) {
        results.push({
          pageId: request.pageId,
          fieldId: request.fieldId,
          value: null,
          error: error instanceof Error ? error.message : 'Calculation failed'
        });
      }
    }

    return results;
  }

  /**
   * Perform aggregation calculation
   */
  private static performAggregation(
    values: any[],
    aggregationType: string,
    propertyId: string
  ): string {
    if (values.length === 0) {
      return this.getDefaultValue(aggregationType);
    }

    switch (aggregationType) {
      case 'count':
        return values.length.toString();

      case 'sum':
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        const sum = numericValues.reduce((acc, val) => acc + val, 0);
        return sum.toString();

      case 'average':
        const avgValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (avgValues.length === 0) return '0';
        const average = avgValues.reduce((acc, val) => acc + val, 0) / avgValues.length;
        return average.toFixed(2);

      case 'min':
        const minValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (minValues.length === 0) return '0';
        return Math.min(...minValues).toString();

      case 'max':
        const maxValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (maxValues.length === 0) return '0';
        return Math.max(...maxValues).toString();

      case 'earliest':
        const earliestDates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (earliestDates.length === 0) return '';
        const earliest = new Date(Math.min(...earliestDates.map(d => d.getTime())));
        return earliest.toISOString().split('T')[0];

      case 'latest':
        const latestDates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (latestDates.length === 0) return '';
        const latest = new Date(Math.max(...latestDates.map(d => d.getTime())));
        return latest.toISOString().split('T')[0];

      default:
        return values.length.toString();
    }
  }

  /**
   * Get default value for aggregation type
   */
  private static getDefaultValue(aggregationType: string): string {
    switch (aggregationType) {
      case 'count':
      case 'sum':
      case 'average':
      case 'min':
      case 'max':
        return '0';
      case 'earliest':
      case 'latest':
        return '';
      default:
        return '0';
    }
  }
}
