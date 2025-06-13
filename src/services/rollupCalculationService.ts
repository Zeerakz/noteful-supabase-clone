
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
      const { data: currentPageProperty } = await supabase
        .from('page_properties')
        .select('value')
        .eq('page_id', pageId)
        .eq('field_id', settings.relation_field_id)
        .single();

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
          .from('fields')
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
          .from('pages')
          .select('title')
          .in('id', relatedPageIds);

        propertyValues = relatedPages?.map(p => p.title) || [];
      } else {
        // Rolling up a specific field property
        const { data: relatedProperties } = await supabase
          .from('page_properties')
          .select('value')
          .eq('field_id', settings.rollup_property)
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
      case 'count':
        return values.length.toString();

      case 'sum':
        if (propertyId === 'count') {
          return values.length.toString();
        }
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
        return earliest.toISOString().split('T')[0]; // Return date only

      case 'latest':
        const latestDates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (latestDates.length === 0) return '';
        const latest = new Date(Math.max(...latestDates.map(d => d.getTime())));
        return latest.toISOString().split('T')[0]; // Return date only

      default:
        return values.length.toString();
    }
  }

  /**
   * Get default value for aggregation type when no data is available
   */
  private static getDefaultValue(aggregationType: string): string {
    switch (aggregationType) {
      case 'count':
        return '0';
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

  /**
   * Bulk recalculate rollup values for all pages in a database
   */
  static async recalculateRollupsForDatabase(
    databaseId: string,
    rollupFields: DatabaseField[],
    allFields: DatabaseField[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all pages in the database
      const { data: pages } = await supabase
        .from('pages')
        .select('id')
        .eq('database_id', databaseId);

      if (!pages) return { success: true };

      // Recalculate each rollup field for each page
      for (const page of pages) {
        for (const rollupField of rollupFields) {
          const { value, error } = await this.calculateRollupValue(
            page.id,
            rollupField,
            allFields
          );

          if (error) {
            console.error(`Error calculating rollup for page ${page.id}, field ${rollupField.id}:`, error);
            continue;
          }

          // Update the computed value
          await supabase
            .from('page_properties')
            .upsert({
              page_id: page.id,
              field_id: rollupField.id,
              computed_value: value,
              value: '', // Rollup fields don't have user-entered values
              created_by: rollupField.created_by
            }, {
              onConflict: 'page_id,field_id'
            });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error recalculating rollups:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Recalculation failed' 
      };
    }
  }
}
