
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  type: 'page' | 'block';
  id: string;
  title: string;
  workspace_id: string;
  created_by: string;
  created_at: string;
  display_title: string;
  display_content: string;
  rank: number;
}

export class SearchService {
  static async globalSearch(
    query: string, 
    workspaceId?: string | null
  ): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('global_search', {
        search_query: query.trim(),
        user_workspace_id: workspaceId || null
      });

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      // Type assertion to ensure the data conforms to our SearchResult interface
      const typedResults = (data || []).map((item: any) => ({
        ...item,
        type: item.type as 'page' | 'block'
      })) as SearchResult[];

      return typedResults;
    } catch (err) {
      console.error('Search service error:', err);
      throw err;
    }
  }

  static async getBlockPageId(blockId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('page_id')
        .eq('id', blockId)
        .single();

      if (error) {
        console.error('Error fetching block page:', error);
        return null;
      }

      return data?.page_id || null;
    } catch (err) {
      console.error('Error in getBlockPageId:', err);
      return null;
    }
  }

  static formatContent(content: string, maxLength: number = 100): string {
    if (!content) return '';
    return content.length > maxLength 
      ? `${content.substring(0, maxLength)}...` 
      : content;
  }
}
