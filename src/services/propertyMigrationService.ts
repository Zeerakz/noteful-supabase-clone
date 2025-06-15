
import { supabase } from '@/integrations/supabase/client';
import { PropertyMigrationResult, PropertyMigrationPreview } from '@/types/propertyMigration';
import { getMigrationRule } from '@/utils/propertyMigrationRules';
import { DatabaseField, PageProperty } from '@/types/database';

export class PropertyMigrationService {
  static async previewMigration(
    field: DatabaseField,
    newType: string
  ): Promise<PropertyMigrationPreview> {
    const migrationRule = getMigrationRule(field.type, newType);
    
    if (!migrationRule) {
      return {
        canMigrate: false,
        warnings: [`Migration from ${field.type} to ${newType} is not supported`],
        result: {
          fieldId: field.id,
          fromType: field.type,
          toType: newType,
          totalValues: 0,
          successfulConversions: 0,
          failedConversions: 0,
          lostValues: 0,
          previewSamples: { successful: [], failed: [] }
        }
      };
    }

    // Fetch existing property values for this field
    const { data: properties, error } = await supabase
      .from('page_properties')
      .select('value')
      .eq('field_id', field.id)
      .not('value', 'is', null);

    if (error) {
      console.error('Error fetching property values:', error);
      return {
        canMigrate: false,
        warnings: ['Failed to fetch existing values'],
        result: {
          fieldId: field.id,
          fromType: field.type,
          toType: newType,
          totalValues: 0,
          successfulConversions: 0,
          failedConversions: 0,
          lostValues: 0,
          previewSamples: { successful: [], failed: [] }
        }
      };
    }

    // Process each value through the migration rule
    const results = {
      successful: [] as Array<{ original: string; converted: string }>,
      failed: [] as Array<{ original: string; reason: string }>
    };

    let successfulCount = 0;
    let failedCount = 0;

    for (const property of properties || []) {
      if (!property.value || property.value.trim() === '') continue;
      
      const conversionResult = migrationRule.converter(property.value);
      
      if (conversionResult.success) {
        successfulCount++;
        if (results.successful.length < 5) { // Limit preview samples
          results.successful.push({
            original: property.value,
            converted: conversionResult.value
          });
        }
      } else {
        failedCount++;
        if (results.failed.length < 5) { // Limit preview samples
          results.failed.push({
            original: property.value,
            reason: conversionResult.error || 'Conversion failed'
          });
        }
      }
    }

    const totalValues = (properties || []).length;
    const lostValues = migrationRule.isLossy ? failedCount : 0;

    return {
      canMigrate: true,
      warnings: migrationRule.warnings,
      result: {
        fieldId: field.id,
        fromType: field.type,
        toType: newType,
        totalValues,
        successfulConversions: successfulCount,
        failedConversions: failedCount,
        lostValues,
        previewSamples: results
      }
    };
  }

  static async executeMigration(
    field: DatabaseField,
    newType: string,
    newSettings?: any
  ): Promise<{ success: boolean; error?: string }> {
    const migrationRule = getMigrationRule(field.type, newType);
    
    if (!migrationRule) {
      return { success: false, error: 'Migration not supported' };
    }

    try {
      // Start a transaction-like process
      
      // 1. Fetch all existing property values
      const { data: properties, error: fetchError } = await supabase
        .from('page_properties')
        .select('id, page_id, value')
        .eq('field_id', field.id);

      if (fetchError) {
        throw new Error(`Failed to fetch existing values: ${fetchError.message}`);
      }

      // 2. Update the field type and settings
      const { error: fieldUpdateError } = await supabase
        .from('fields')
        .update({
          type: newType as any,
          settings: newSettings || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', field.id);

      if (fieldUpdateError) {
        throw new Error(`Failed to update field: ${fieldUpdateError.message}`);
      }

      // 3. Convert and update all property values
      const updates = [];
      const deletions = [];

      for (const property of properties || []) {
        if (!property.value || property.value.trim() === '') continue;
        
        const conversionResult = migrationRule.converter(property.value);
        
        if (conversionResult.success) {
          updates.push({
            id: property.id,
            value: conversionResult.value,
            updated_at: new Date().toISOString()
          });
        } else {
          // Mark for deletion if conversion failed and it's a lossy migration
          if (migrationRule.isLossy) {
            deletions.push(property.id);
          }
        }
      }

      // Batch update successful conversions
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('page_properties')
          .upsert(updates);

        if (updateError) {
          throw new Error(`Failed to update property values: ${updateError.message}`);
        }
      }

      // Batch delete failed conversions for lossy migrations
      if (deletions.length > 0) {
        const { error: deleteError } = await supabase
          .from('page_properties')
          .delete()
          .in('id', deletions);

        if (deleteError) {
          throw new Error(`Failed to delete invalid property values: ${deleteError.message}`);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Migration failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration failed' 
      };
    }
  }
}
