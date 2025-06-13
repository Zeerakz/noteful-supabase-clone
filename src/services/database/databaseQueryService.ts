
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
      
      // First get all pages for this database with their properties
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
      
      if (pagesError) {
        console.error('Supabase error fetching pages:', pagesError);
        throw pagesError;
      }

      if (!pages) {
        console.log('No pages found');
        return { data: [], error: null };
      }

      console.log('Pages fetched successfully:', pages.length);
      let processedPages = pages;

      // Apply complex filters on the client side with current user context
      if (filterGroup && fields) {
        processedPages = applyComplexFilters(pages, filterGroup, fields, currentUserId);
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
}
