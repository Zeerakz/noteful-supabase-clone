
import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';

export async function fetchPages(workspaceId: string): Promise<{ data: Block[] | null; error: string | null }> {
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

export async function fetchDatabasePages(databaseId: string): Promise<{ data: Block[] | null; error: string | null }> {
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

export async function getPageProperties(pageId: string): Promise<{ data: any[] | null; error: string | null }> {
  try {
    if (!pageId || pageId === 'null' || pageId === 'undefined') {
      throw new Error('Invalid page ID');
    }

    const { data, error } = await supabase
      .from('property_values')
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
