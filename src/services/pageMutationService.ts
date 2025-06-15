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

    let query = supabase
      .from('blocks')
      .select('pos')
      .eq('workspace_id', workspaceId)
      .is('properties->>database_id', null);

    if (pageDetails.parent_id) {
      query = query.eq('parent_id', pageDetails.parent_id);
    } else {
      query = query.is('parent_id', null).eq('type', 'page');
    }

    const { data: existingPages, error: posError } = await query
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

export async function duplicatePage(
  pageId: string,
  userId: string
): Promise<{ data: Block | null; error: string | null }> {
  try {
    // 1. Fetch the original page
    const { data: originalPage, error: fetchPageError } = await supabase
      .from('blocks')
      .select('*')
      .eq('id', pageId)
      .eq('type', 'page')
      .single();

    if (fetchPageError || !originalPage) {
      throw new Error(fetchPageError?.message || 'Original page not found.');
    }

    // 2. Fetch all blocks of the original page
    const { data: originalBlocks, error: fetchBlocksError } = await supabase
      .from('blocks')
      .select('*')
      .eq('parent_id', pageId)
      .order('pos', { ascending: true });
    
    if (fetchBlocksError) {
      throw new Error(fetchBlocksError.message || 'Could not fetch page blocks.');
    }
    
    // 3. Create the new page with a modified title
    const newPageDetails: PageCreateRequest = {
      properties: {
        ...(originalPage.properties as object),
        title: `${(originalPage.properties as any)?.title || 'Untitled'} (Copy)`,
      },
      parent_id: originalPage.parent_id || undefined,
    };
    
    const { data: newPage, error: createPageError } = await createPage(
      originalPage.workspace_id,
      userId,
      newPageDetails
    );

    if (createPageError || !newPage) {
        throw new Error(createPageError || 'Failed to create duplicated page.');
    }

    // 4. Create copies of the blocks for the new page
    if (originalBlocks && originalBlocks.length > 0) {
      const newBlocksData = originalBlocks.map(block => ({
        type: block.type,
        properties: block.properties as Record<string, any>,
        content: block.content as Record<string, any> | null,
        pos: block.pos,
        archived: block.archived,
        in_trash: block.in_trash,
        parent_id: newPage.id,
        workspace_id: newPage.workspace_id,
        created_by: userId,
        last_edited_by: userId,
      }));

      const { error: insertBlocksError } = await supabase
        .from('blocks')
        .insert(newBlocksData);

      if (insertBlocksError) {
        // Clean up the created page if block creation fails
        await supabase.from('blocks').delete().eq('id', newPage.id);
        throw new Error(insertBlocksError.message || 'Failed to copy blocks.');
      }
    }

    // Refetch the new page with all its properties after potential inheritance
     const { data: finalNewPage, error: refetchError } = await supabase
      .from('blocks')
      .select('*')
      .eq('id', newPage.id)
      .single();

    if(refetchError) {
        console.error("Could not refetch duplicated page", refetchError);
        return { data: newPage, error: null }; // return what we have
    }

    return { data: finalNewPage as Block, error: null };
  } catch (err) {
    console.error('Page duplication error:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to duplicate page'
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
