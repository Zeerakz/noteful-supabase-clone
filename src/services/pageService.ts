import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';
import { PropertyInheritanceService } from '@/services/propertyInheritanceService';

// Define specific types for page creation and updates for clarity
export interface PageCreateRequest {
  properties: {
    title: string;
    database_id?: string;
  };
  parent_id?: string;
}

export type PageUpdateRequest = Partial<Omit<Block, 'id' | 'created_time' | 'created_by' | 'workspace_id'>>;


export class PageService {
  static async fetchPages(workspaceId: string): Promise<{ data: Block[] | null; error: string | null }> {
    try {
      if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
        throw new Error('Invalid workspace ID');
      }

      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'page')
        .is('in_trash', false)
        .order('pos', { ascending: true });

      if (error) throw error;
      return { data: (data as Block[]) || [], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch pages' 
      };
    }
  }

  static async fetchDatabasePages(databaseId: string): Promise<{ data: Block[] | null; error: string | null }> {
    try {
      if (!databaseId || databaseId === 'null' || databaseId === 'undefined') {
        throw new Error('Invalid database ID');
      }

      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('properties->>database_id', databaseId)
        .eq('type', 'page')
        .order('created_time', { ascending: false });

      if (error) throw error;
      return { data: (data as Block[]) || [], error: null };
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
    pageDetails: PageCreateRequest
  ): Promise<{ data: Block | null; error: string | null }> {
    try {
      // Validate required parameters
      if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
        throw new Error('Invalid workspace ID');
      }
      if (!userId || userId === 'null' || userId === 'undefined') {
        throw new Error('Invalid user ID');
      }
      if (!pageDetails.properties.title || pageDetails.properties.title.trim() === '') {
        throw new Error('Title is required');
      }

      // Get the next position
      const { data: existingPages, error: posError } = await supabase
        .from('blocks')
        .select('pos')
        .eq('workspace_id', workspaceId)
        .eq('parent_id', pageDetails.parent_id || null)
        .is('properties->>database_id', null)
        .order('pos', { ascending: false })
        .limit(1);

      if (posError) throw posError;

      const nextPos = existingPages && existingPages.length > 0 ? existingPages[0].pos + 1 : 0;

      const insertData = {
        workspace_id: workspaceId,
        parent_id: pageDetails.parent_id || null,
        properties: pageDetails.properties,
        type: 'page' as const,
        created_by: userId,
        last_edited_by: userId,
        pos: nextPos,
      };

      const { data, error } = await supabase
        .from('blocks')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      const newPage = data as Block;
      console.log('Page created successfully:', newPage);

      // If page is created in a database, apply property inheritance
      if (newPage && newPage.properties?.database_id) {
        await PropertyInheritanceService.applyDatabaseInheritance(
          newPage.id,
          newPage.properties.database_id,
          userId
        );
      }

      return { data: newPage, error: null };
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
  ): Promise<{ data: Block | null; error: string | null }> {
    try {
      if (!pageId || pageId === 'null' || pageId === 'undefined') {
        throw new Error('Invalid page ID');
      }

      const finalUpdates: PageUpdateRequest = {
        ...updates,
        last_edited_time: new Date().toISOString(),
      };

      const { data: currentPage, error: fetchError } = await supabase
        .from('blocks')
        .select('properties, created_by')
        .eq('id', pageId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('blocks')
        .update(finalUpdates as any)
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;
      
      const updatedPage = data as Block;

      // Handle database inheritance when database_id changes
      if (updates.properties && currentPage) {
        const oldDatabaseId = (currentPage.properties as any)?.database_id;
        const newDatabaseId = (updates.properties as any)?.database_id;

        if (newDatabaseId !== oldDatabaseId) {
          if (oldDatabaseId) {
            await PropertyInheritanceService.removeDatabaseInheritance(pageId, oldDatabaseId);
          }
          if (newDatabaseId) {
            await PropertyInheritanceService.applyDatabaseInheritance(
              pageId,
              newDatabaseId,
              currentPage.created_by
            );
          }
        }
      }

      return { data: updatedPage, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update page' 
      };
    }
  }

  static async deletePage(pageId: string): Promise<{ error: string | null }> {
    try {
      // For now, we'll just mark as in_trash
      const { error } = await supabase
        .from('blocks')
        .update({ in_trash: true, last_edited_time: new Date().toISOString() })
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
