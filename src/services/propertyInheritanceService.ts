
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField, PageProperty } from '@/types/database';
import { PropertyConfig } from '@/types/property';
import { propertyRegistry } from '@/types/propertyRegistry';
import { DatabaseFieldService } from '@/services/database/databaseFieldService';
import { PagePropertyService } from '@/services/pagePropertyService';

export class PropertyInheritanceService {
  /**
   * Safely converts Supabase Json type to PropertyConfig
   */
  private static safelyParseConfig(settings: any): PropertyConfig {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return {};
    }
    return settings as PropertyConfig;
  }

  /**
   * Applies database property inheritance to a page that was moved into a database
   */
  static async applyDatabaseInheritance(
    pageId: string,
    databaseId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; appliedProperties?: PageProperty[] }> {
    try {
      // Fetch all fields for the target database
      const { data: fields, error: fieldsError } = await DatabaseFieldService.fetchDatabaseFields(databaseId);
      
      if (fieldsError || !fields) {
        throw new Error(fieldsError || 'Failed to fetch database fields');
      }

      // Get existing properties for the page to avoid overwriting
      const { data: existingProperties, error: propertiesError } = await PagePropertyService.fetchPageProperties(pageId);
      
      if (propertiesError) {
        console.warn('Failed to fetch existing properties:', propertiesError);
      }

      const existingFieldIds = new Set(
        (existingProperties || []).map(prop => prop.field_id)
      );

      const appliedProperties: PageProperty[] = [];
      const propertyPromises: Promise<any>[] = [];

      // Create properties for each database field
      for (const field of fields) {
        // Skip if property already exists for this field
        if (existingFieldIds.has(field.id)) {
          continue;
        }

        // Get the property type definition
        const definition = propertyRegistry.get(field.type as any);
        
        // Determine the default value
        let defaultValue = '';
        if (definition) {
          const config = this.safelyParseConfig(field.settings);
          defaultValue = definition.getDefaultValue(config);
          
          // Format the value according to the property type
          if (defaultValue) {
            defaultValue = definition.formatValue(defaultValue, config);
          }
        }

        // Create the property with default value
        const propertyPromise = PagePropertyService.upsertPageProperty(
          pageId,
          field.id,
          defaultValue,
          userId
        ).then(result => {
          if (result.data) {
            appliedProperties.push(result.data);
          }
          return result;
        });

        propertyPromises.push(propertyPromise);
      }

      // Execute all property creation promises
      const results = await Promise.all(propertyPromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.warn('Some properties failed to inherit:', errors);
      }

      console.log(`Successfully applied inheritance: ${appliedProperties.length} properties created for page ${pageId}`);

      return {
        success: true,
        appliedProperties
      };

    } catch (error) {
      console.error('Property inheritance failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Property inheritance failed'
      };
    }
  }

  /**
   * Removes database-specific properties when a page is moved out of a database
   */
  static async removeDatabaseInheritance(
    pageId: string,
    databaseId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all fields for the database the page is being removed from
      const { data: fields, error: fieldsError } = await DatabaseFieldService.fetchDatabaseFields(databaseId);
      
      if (fieldsError || !fields) {
        throw new Error(fieldsError || 'Failed to fetch database fields');
      }

      // Delete properties that correspond to database fields
      const deletionPromises = fields.map(field =>
        PagePropertyService.deletePageProperty(pageId, field.id)
      );

      const results = await Promise.all(deletionPromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        console.warn('Some properties failed to remove:', errors);
      }

      console.log(`Successfully removed inheritance: ${fields.length} properties removed from page ${pageId}`);

      return { success: true };

    } catch (error) {
      console.error('Property inheritance removal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove database properties'
      };
    }
  }

  /**
   * Handles property inheritance when database fields are added/removed
   */
  static async syncDatabasePropertyChanges(
    databaseId: string,
    addedFields: DatabaseField[],
    removedFieldIds: string[],
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all pages in the database
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('id')
        .eq('database_id', databaseId);

      if (pagesError) {
        throw new Error(pagesError.message);
      }

      if (!pages || pages.length === 0) {
        return { success: true }; // No pages to update
      }

      const pageIds = pages.map(page => page.id);

      // Add properties for new fields
      if (addedFields.length > 0) {
        const additionPromises: Promise<any>[] = [];

        for (const field of addedFields) {
          const definition = propertyRegistry.get(field.type as any);
          const config = this.safelyParseConfig(field.settings);
          const defaultValue = definition ? definition.getDefaultValue(config) : '';
          const formattedValue = definition ? definition.formatValue(defaultValue, config) : defaultValue;

          for (const pageId of pageIds) {
            additionPromises.push(
              PagePropertyService.upsertPageProperty(pageId, field.id, formattedValue, userId)
            );
          }
        }

        await Promise.all(additionPromises);
      }

      // Remove properties for deleted fields
      if (removedFieldIds.length > 0) {
        const removalPromises: Promise<any>[] = [];

        for (const fieldId of removedFieldIds) {
          for (const pageId of pageIds) {
            removalPromises.push(
              PagePropertyService.deletePageProperty(pageId, fieldId)
            );
          }
        }

        await Promise.all(removalPromises);
      }

      console.log(`Successfully synced property changes for database ${databaseId}: +${addedFields.length} fields, -${removedFieldIds.length} fields`);

      return { success: true };

    } catch (error) {
      console.error('Database property sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync database property changes'
      };
    }
  }
}
