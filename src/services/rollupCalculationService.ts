
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField, RollupFieldSettings, RelationFieldSettings } from '@/types/database';

export class RollupCalculationService {
  /**
   * Calculate rollup value for a specific page
   */
  static async calculateRollupValue(
    pageId: string,
    rollupField: DatabaseField,
    allFields: DatabaseField[]
  ): Promise<{ value: string | null; error?: string }> {
    try {
      const settings = rollupField.settings as RollupFieldSettings;
      
      if (!settings.relation_field_id || !settings.rollup_property || !settings.aggregation) {
        return { value: null, error: 'Invalid rollup configuration' };
      }

      // Get the relation field
      const relationField = allFields.find(f => f.id === settings.relation_field_id);
      if (!relationField || relationField.type !== 'relation') {
        return { value: null, error: 'Relation field not found' };
      }

      const relationSettings = relationField.settings as RelationFieldSettings;
      if (!relationSettings.target_database_id) {
        return { value: null, error: 'Target database not configured' };
      }

      // Get the current page's relation value
      const { data: currentPageProperty, error: relationValueError } = await supabase
        .from('property_values')
        .select('value')
        .eq('page_id', pageId)
        .eq('property_id', settings.relation_field_id)
        .single();
        
      if(relationValueError) {
        return { value: null, error: relationValueError.message };
      }

      if (!currentPageProperty?.value) {
        return { value: this.getDefaultValue(settings.aggregation), error: null };
      }

      // Parse related page IDs
      const relatedPageIds = currentPageProperty.value.split(',').filter(Boolean);
      if (relatedPageIds.length === 0) {
        return { value: this.getDefaultValue(settings.aggregation), error: null };
      }

      // Handle special system properties
      if (settings.rollup_property === 'count') {
        return { value: relatedPageIds.length.toString(), error: null };
      }

      // Get target field if rolling up a specific property
      if (settings.rollup_property !== 'title') {
        const { data: targetFields } = await supabase
          .from('database_properties')
          .select('*')
          .eq('database_id', relationSettings.target_database_id);

        const targetField = targetFields?.find(f => f.id === settings.rollup_property);
        if (!targetField) {
          return { value: null, error: 'Target property not found' };
        }
      }

      // Get property values from related pages
      let propertyValues: any[] = [];

      if (settings.rollup_property === 'title') {
        // Rolling up page titles
        const { data: relatedPages } = await supabase
          .from('blocks')
          .select('properties')
          .in('id', relatedPageIds);

        propertyValues = relatedPages?.map(p => (p.properties as any)?.title).filter(Boolean) || [];
      } else {
        // Rolling up a specific field property
        const { data: relatedProperties } = await supabase
          .from('property_values')
          .select('value')
          .eq('property_id', settings.rollup_property)
          .in('page_id', relatedPageIds);

        propertyValues = relatedProperties?.map(p => p.value).filter(Boolean) || [];
      }

      // Perform aggregation
      const result = this.performAggregation(
        propertyValues,
        settings.aggregation,
        settings.rollup_property
      );

      return { value: result, error: null };

    } catch (error) {
      console.error('Error calculating rollup value:', error);
      return { 
        value: null, 
        error: error instanceof Error ? error.message : 'Calculation failed' 
      };
    }
  }

  /**
   * Perform the actual aggregation calculation
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
      case 'count': // This is handled earlier, but for completeness
        return values.length.toString();
      case 'sum':
        return values.reduce((sum, v) => sum + (parseFloat(v) || 0), 0).toString();
      case 'average':
        const sum = values.reduce((s, v) => s + (parseFloat(v) || 0), 0);
        return (sum / values.length).toString();
      case 'min':
        const minValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        return minValues.length > 0 ? Math.min(...minValues).toString() : '';
      case 'max':
        const maxValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        return maxValues.length > 0 ? Math.max(...maxValues).toString() : '';
      case 'earliest':
        const dates = values.map(v => new Date(v).getTime()).filter(t => !isNaN(t));
        return dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : '';
      case 'latest':
        const latestDates = values.map(v => new Date(v).getTime()).filter(t => !isNaN(t));
        return latestDates.length > 0 ? new Date(Math.max(...latestDates)).toISOString() : '';
      default:
        return '';
    }
  }

  private static getDefaultValue(aggregationType: string): string {
    switch (aggregationType) {
      case 'count':
      case 'sum':
        return '0';
      default:
        return '';
    }
  }

  /**
   * Update computed property value in the database
   */
  private static async updateComputedProperty(
    pageId: string,
    propertyId: string,
    value: string | null
  ): Promise<{ error?: string }> {
    if (value === null) return {};

    const { error } = await supabase
      .from('property_values')
      .update({ computed_value: value })
      .eq('page_id', pageId)
      .eq('property_id', propertyId);

    if (error) {
      console.error('Error updating computed property:', error);
      return { error: error.message };
    }
    return {};
  }

  /**
   * Recalculate all rollup fields for a specific page
   */
  static async recalculateAllForPage(
    pageId: string,
    allFields: DatabaseField[]
  ): Promise<void> {
    const rollupFields = allFields.filter(f => f.type === 'rollup');
    for (const field of rollupFields) {
      const newValue = await this.calculateRollupValue(pageId, field, allFields);
      if (newValue.value !== null) {
        await this.updateComputedProperty(pageId, field.id, newValue.value);
      }
    }
  }

  /**
   * Recalculate a single rollup field for all pages in a database
   */
  static async recalculateFieldForAllPages(
    fieldId: string,
    databaseId: string,
    allFields: DatabaseField[]
  ): Promise<void> {
    const rollupField = allFields.find(f => f.id === fieldId);
    if (!rollupField || rollupField.type !== 'rollup') return;
    
    const { data: pages } = await supabase
      .from('blocks')
      .select('id')
      .eq('type', 'page')
      .eq('properties->>database_id', databaseId);

    if (pages) {
      for (const page of pages) {
        const newValue = await this.calculateRollupValue(page.id, rollupField, allFields);
        if (newValue.value !== null) {
          await this.updateComputedProperty(page.id, fieldId, String(newValue.value));
        }
      }
    }
  }
}
