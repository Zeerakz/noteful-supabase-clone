import { supabase } from '@/integrations/supabase/client';
import { Page, PageCreateRequest, PageUpdateRequest } from '@/types/page';
import { PropertyInheritanceService } from '@/services/propertyInheritanceService';

export class PageService {
  static async fetchPages(workspaceId: string): Promise<{ data: Page[] | null; error: string | null }> {
    try {
      // Validate workspaceId
      if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
        throw new Error('Invalid workspace ID');
      }

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
      // Validate databaseId
      if (!databaseId || databaseId === 'null' || databaseId === 'undefined') {
        throw new Error('Invalid database ID');
      }

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

  static async getPageProperties(pageId: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      // Validate pageId
      if (!pageId || pageId === 'null' || pageId === 'undefined') {
        throw new Error('Invalid page ID');
      }

      const { data, error } = await supabase
        .from('page_properties')
        .select('*')
        .eq('page_id', pageId);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch page properties' 
      };
    }
  }

  static async createPage(
    workspaceId: string, 
    userId: string, 
    { title, parentPageId, databaseId }: PageCreateRequest
  ): Promise<{ data: Page | null; error: string | null }> {
    try {
      // Validate required parameters
      if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
        throw new Error('Invalid workspace ID');
      }
      if (!userId || userId === 'null' || userId === 'undefined') {
        throw new Error('Invalid user ID');
      }
      if (!title || title.trim() === '') {
        throw new Error('Title is required');
      }

      // Validate optional UUIDs
      if (parentPageId && (parentPageId === 'null' || parentPageId === 'undefined')) {
        parentPageId = undefined;
      }
      if (databaseId && (databaseId === 'null' || databaseId === 'undefined')) {
        databaseId = undefined;
      }

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

      const insertData = {
        workspace_id: workspaceId,
        parent_page_id: parentPageId || null,
        database_id: databaseId || null,
        title: title.trim(),
        created_by: userId,
        order_index: nextOrderIndex,
      };

      console.log('Inserting page with data:', insertData);

      const { data, error } = await supabase
        .from('pages')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Page created successfully:', data);

      // If page is created in a database, apply property inheritance
      if (data && databaseId) {
        const inheritanceResult = await PropertyInheritanceService.applyDatabaseInheritance(
          data.id,
          databaseId,
          userId
        );

        if (!inheritanceResult.success) {
          console.warn('Property inheritance failed:', inheritanceResult.error);
          // Don't fail the page creation, just log the warning
        }
      }

      return { data, error: null };
    } catch (err) {
      console.error('Page creation error:', err);
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
      // Validate pageId
      if (!pageId || pageId === 'null' || pageId === 'undefined') {
        throw new Error('Invalid page ID');
      }

      // Clean up null values in updates - properly handle optional properties
      const cleanUpdates: Partial<PageUpdateRequest> = {};
      
      // Only include properties that are actually being updated
      if (updates.title !== undefined) {
        cleanUpdates.title = updates.title === 'null' || updates.title === 'undefined' ? undefined : updates.title;
      }
      
      if (updates.parent_page_id !== undefined) {
        cleanUpdates.parent_page_id = updates.parent_page_id === 'null' || updates.parent_page_id === 'undefined' ? null : updates.parent_page_id;
      }
      
      if (updates.database_id !== undefined) {
        cleanUpdates.database_id = updates.database_id === 'null' || updates.database_id === 'undefined' ? null : updates.database_id;
      }
      
      if (updates.order_index !== undefined) {
        cleanUpdates.order_index = updates.order_index;
      }

      // Get the current page data to check for database changes
      const { data: currentPage, error: fetchError } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('pages')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;

      // Handle database inheritance when database_id changes
      if (cleanUpdates.database_id !== undefined && currentPage) {
        const oldDatabaseId = currentPage.database_id;
        const newDatabaseId = cleanUpdates.database_id;

        // If moving from standalone to database
        if (!oldDatabaseId && newDatabaseId) {
          const inheritanceResult = await PropertyInheritanceService.applyDatabaseInheritance(
            pageId,
            newDatabaseId,
            currentPage.created_by
          );

          if (!inheritanceResult.success) {
            console.warn('Property inheritance failed:', inheritanceResult.error);
          }
        }
        // If moving from database to standalone
        else if (oldDatabaseId && !newDatabaseId) {
          const removalResult = await PropertyInheritanceService.removeDatabaseInheritance(
            pageId,
            oldDatabaseId
          );

          if (!removalResult.success) {
            console.warn('Property inheritance removal failed:', removalResult.error);
          }
        }
        // If moving between databases
        else if (oldDatabaseId && newDatabaseId && oldDatabaseId !== newDatabaseId) {
          // Remove old database properties
          await PropertyInheritanceService.removeDatabaseInheritance(pageId, oldDatabaseId);
          
          // Apply new database properties
          const inheritanceResult = await PropertyInheritanceService.applyDatabaseInheritance(
            pageId,
            newDatabaseId,
            currentPage.created_by
          );

          if (!inheritanceResult.success) {
            console.warn('Property inheritance failed:', inheritanceResult.error);
          }
        }
      }

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
      // Validate pageId
      if (!pageId || pageId === 'null' || pageId === 'undefined') {
        throw new Error('Invalid page ID');
      }

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
