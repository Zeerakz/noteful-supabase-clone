
import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';
import { PropertyInheritanceService } from '@/services/propertyInheritanceService';

export interface PageCreateRequest {
  properties: {
    title: string;
    database_id?: string;
  };
  parent_id?: string;
}

export type PageUpdateRequest = Partial<Omit<Block, 'id' | 'created_time' | 'created_by' | 'workspace_id'>>;

// Helper function to get the next position for a page
async function getNextPagePosition(workspaceId: string, parentId?: string, databaseId?: string): Promise<number> {
  try {
    let query = supabase
      .from('blocks')
      .select('pos')
      .eq('workspace_id', workspaceId);

    if (databaseId) {
      // For database entries, check within the same database
      query = query.eq('properties->>database_id', databaseId);
    } else {
      // For regular pages, exclude database entries and filter by parent
      query = query.is('properties->>database_id', null);
      
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null).eq('type', 'page');
      }
    }

    const { data, error } = await query
      .order('pos', { ascending: false })
      .limit(1);

    if (error) throw error;

    const maxPos = data && data.length > 0 ? data[0].pos : -1;
    return maxPos + 1;
  } catch (err) {
    console.error('Error getting next page position:', err);
    // Fallback to a simple increment if query fails
    return Date.now() % 1000000; // Use modulo to keep within integer range
  }
}

export async function createPage(
  workspaceId: string,
  userId: string,
  pageDetails: PageCreateRequest
): Promise<{ data: Block | null; error: string | null }> {
  try {
    if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
      throw new Error('Invalid workspace ID');
    }
    if (!userId || userId === 'null' || userId === 'undefined') {
      throw new Error('Invalid user ID');
    }
    if (!pageDetails.properties.title || pageDetails.properties.title.trim() === '') {
      throw new Error('Title is required');
    }

    const nextPos = await getNextPagePosition(
      workspaceId, 
      pageDetails.parent_id,
      pageDetails.properties.database_id
    );

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

export async function updatePage(
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

export async function deletePage(pageId: string): Promise<{ error: string | null }> {
  try {
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
