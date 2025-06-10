
import { supabase } from '@/integrations/supabase/client';
import { Page, PageCreateRequest, PageUpdateRequest } from '@/types/page';

export class PageService {
  static async fetchPages(workspaceId: string): Promise<{ data: Page[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch pages' 
      };
    }
  }

  static async fetchDatabasePages(databaseId: string): Promise<{ data: Page[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('database_id', databaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch database pages' 
      };
    }
  }

  static async createPage(
    workspaceId: string, 
    userId: string, 
    { title, parentPageId, databaseId }: PageCreateRequest
  ): Promise<{ data: Page | null; error: string | null }> {
    try {
      // Get the next order index for this parent or database
      let nextOrderIndex = 0;
      
      if (databaseId) {
        // For database pages, order by creation time (newest first)
        const { data: existingPages } = await supabase
          .from('pages')
          .select('order_index')
          .eq('database_id', databaseId)
          .order('order_index', { ascending: false })
          .limit(1);

        nextOrderIndex = existingPages && existingPages.length > 0 
          ? existingPages[0].order_index + 1 
          : 0;
      } else {
        // For regular pages, maintain hierarchy order
        const { data: existingPages } = await supabase
          .from('pages')
          .select('order_index')
          .eq('workspace_id', workspaceId)
          .eq('parent_page_id', parentPageId || null)
          .is('database_id', null)
          .order('order_index', { ascending: false })
          .limit(1);

        nextOrderIndex = existingPages && existingPages.length > 0 
          ? existingPages[0].order_index + 1 
          : 0;
      }

      const { data, error } = await supabase
        .from('pages')
        .insert([
          {
            workspace_id: workspaceId,
            parent_page_id: parentPageId || null,
            database_id: databaseId || null,
            title,
            created_by: userId,
            order_index: nextOrderIndex,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create page' 
      };
    }
  }

  static async updatePage(
    pageId: string, 
    updates: PageUpdateRequest
  ): Promise<{ data: Page | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update page' 
      };
    }
  }

  static async deletePage(pageId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete page' 
      };
    }
  }
}
