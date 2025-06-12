import { supabase } from '@/integrations/supabase/client';
import { Database, DatabaseCreateRequest, DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';

export class DatabaseService {
  static async createDatabase(
    workspaceId: string,
    userId: string,
    request: DatabaseCreateRequest
  ): Promise<{ data: Database | null; error: string | null }> {
    try {
      const tableName = `db_${request.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      
      // Create database record - now using proper types
      const { data: database, error: dbError } = await supabase
        .from('databases')
        .insert([
          {
            workspace_id: workspaceId,
            name: request.name,
            table_name: tableName,
            description: request.description,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // Create field records
      const fieldsToCreate = request.fields.map((field, index) => ({
        database_id: database.id,
        name: field.name,
        type: field.type,
        settings: field.settings || {},
        pos: index,
        created_by: userId,
      }));

      const { error: fieldsError } = await supabase
        .from('fields')
        .insert(fieldsToCreate);

      if (fieldsError) throw fieldsError;

      return { data: database as Database, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create database' 
      };
    }
  }

  static async fetchDatabases(workspaceId: string): Promise<{ data: Database[] | null; error: string | null }> {
    try {
      // Now using proper types without type assertion
      const { data, error } = await supabase
        .from('databases')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: (data || []) as Database[], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch databases' 
      };
    }
  }

  static async fetchDatabaseFields(databaseId: string): Promise<{ data: DatabaseField[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('database_id', databaseId)
        .order('pos', { ascending: true });

      if (error) throw error;
      return { data: (data || []) as DatabaseField[], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch database fields' 
      };
    }
  }

  static async createDatabasePage(
    databaseId: string,
    userId: string,
    title: string
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert([
          {
            database_id: databaseId,
            title: title,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create database page' 
      };
    }
  }

  static async createPageProperty(
    pageId: string,
    fieldId: string,
    value: string,
    userId: string
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('page_properties')
        .insert([
          {
            page_id: pageId,
            field_id: fieldId,
            value: value,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create page property' 
      };
    }
  }

  static async fetchDatabasePages(
    databaseId: string,
    filters?: FilterRule[],
    fields?: DatabaseField[],
    sortRules?: SortRule[]
  ): Promise<{ data: any[] | null; error: string | null }> {
    try {
      // First get all pages for this database
      let pagesQuery = supabase
        .from('pages')
        .select(`
          *,
          page_properties (
            field_id,
            value
          )
        `)
        .eq('database_id', databaseId)
        .order('created_at', { ascending: false });

      const { data: pages, error: pagesError } = await pagesQuery;
      if (pagesError) throw pagesError;

      if (!pages) {
        return { data: [], error: null };
      }

      let processedPages = pages;

      // Apply filters on the client side since we need to filter by page properties
      if (filters && filters.length > 0) {
        processedPages = pages.filter(page => {
          const pageProperties = page.page_properties || [];
          const propertiesMap: Record<string, string> = {};
          
          pageProperties.forEach((prop: any) => {
            propertiesMap[prop.field_id] = prop.value || '';
          });

          return filters.every(filter => {
            const field = fields?.find(f => f.id === filter.fieldId);
            if (!field) return true;

            const value = propertiesMap[filter.fieldId] || '';
            const filterValue = filter.value.toLowerCase();
            const itemValue = String(value).toLowerCase();

            switch (filter.operator) {
              case 'equals':
                return itemValue === filterValue;
              case 'not_equals':
                return itemValue !== filterValue;
              case 'contains':
                return itemValue.includes(filterValue);
              case 'not_contains':
                return !itemValue.includes(filterValue);
              case 'is_empty':
                return !value || value.trim() === '';
              case 'is_not_empty':
                return value && value.trim() !== '';
              default:
                return true;
            }
          });
        });
      }

      // Apply sorting on the client side
      if (sortRules && sortRules.length > 0 && fields) {
        processedPages = processedPages.sort((a, b) => {
          const aProperties: Record<string, string> = {};
          const bProperties: Record<string, string> = {};
          
          (a.page_properties || []).forEach((prop: any) => {
            aProperties[prop.field_id] = prop.value || '';
          });
          
          (b.page_properties || []).forEach((prop: any) => {
            bProperties[prop.field_id] = prop.value || '';
          });

          for (const sortRule of sortRules) {
            const field = fields.find(f => f.id === sortRule.fieldId);
            if (!field) continue;

            let aValue: string | number = aProperties[sortRule.fieldId] || '';
            let bValue: string | number = bProperties[sortRule.fieldId] || '';

            // Handle different field types for proper sorting
            if (field.type === 'number') {
              aValue = parseFloat(String(aValue)) || 0;
              bValue = parseFloat(String(bValue)) || 0;
            } else if (field.type === 'date') {
              aValue = new Date(String(aValue) || '1970-01-01').getTime();
              bValue = new Date(String(bValue) || '1970-01-01').getTime();
            } else {
              // For text fields, do case-insensitive comparison
              aValue = String(aValue).toLowerCase();
              bValue = String(bValue).toLowerCase();
            }

            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;

            if (comparison !== 0) {
              return sortRule.direction === 'asc' ? comparison : -comparison;
            }
          }

          return 0;
        });
      }

      return { data: processedPages, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch database pages' 
      };
    }
  }

  static async deleteDatabase(databaseId: string): Promise<{ error: string | null }> {
    try {
      // Now using proper types without type assertion
      const { error } = await supabase
        .from('databases')
        .delete()
        .eq('id', databaseId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete database' 
      };
    }
  }
}
