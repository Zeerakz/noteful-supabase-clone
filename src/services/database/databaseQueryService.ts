
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { applyComplexFilters } from '@/utils/filterUtils';

export class DatabaseQueryService {
  static async fetchDatabasePages(
    databaseId: string,
    filterGroup?: FilterGroup,
    fields?: DatabaseField[],
    sortRules?: SortRule[],
    currentUserId?: string
  ): Promise<{ data: any[] | null; error: string | null }> {
    try {
      console.log('Fetching pages for database:', databaseId);
      
      // 1. Fetch all blocks that are pages for the given database
      const { data: pages, error: pagesError } = await supabase
        .from('blocks')
        .select('*')
        .eq('type', 'page')
        .eq('properties->>database_id', databaseId);

      if (pagesError) {
        console.error('Supabase error fetching pages:', pagesError);
        throw pagesError;
      }

      if (!pages || pages.length === 0) {
        console.log('No pages found');
        return { data: [], error: null };
      }
      
      const pageIds = pages.map(p => p.id);

      // 2. Fetch all properties for these pages
      const { data: properties, error: propertiesError } = await supabase
        .from('property_values')
        .select('page_id, property_id, value')
        .in('page_id', pageIds);
      
      if (propertiesError) throw propertiesError;

      // 3. Combine pages with their properties
      const pagesWithProperties = pages.map(page => {
        const pageProperties = properties?.filter(p => p.page_id === page.id) || [];
        return {
          ...page,
          page_properties: pageProperties.map(({ property_id, value }) => ({ property_id, value }))
        };
      });

      console.log('Pages fetched successfully:', pagesWithProperties.length);
      let processedPages = pagesWithProperties;

      // Apply complex filters on the client side with current user context
      if (filterGroup && fields) {
        processedPages = applyComplexFilters(pagesWithProperties, filterGroup, fields, currentUserId);
      }

      // Apply sorting on the client side
      if (sortRules && sortRules.length > 0 && fields) {
        processedPages = this.applySorting(processedPages, sortRules, fields);
      }

      return { data: processedPages, error: null };
    } catch (err) {
      console.error('Error in fetchDatabasePages:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch database pages' 
      };
    }
  }

  private static applySorting(pages: any[], sortRules: SortRule[], fields: DatabaseField[]): any[] {
    return pages.sort((a, b) => {
      const aProperties: Record<string, string> = {};
      const bProperties: Record<string, string> = {};
      
      (a.page_properties || []).forEach((prop: any) => {
        aProperties[prop.property_id] = prop.value || '';
      });
      
      (b.page_properties || []).forEach((prop: any) => {
        bProperties[prop.property_id] = prop.value || '';
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
}
