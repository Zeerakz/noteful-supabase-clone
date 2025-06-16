
import { supabase } from '@/integrations/supabase/client';

export class BlockPositionService {
  /**
   * Get the next available position for a block within a parent
   */
  static async getNextBlockPosition(parentId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('pos')
        .eq('parent_id', parentId)
        .order('pos', { ascending: false })
        .limit(1);

      if (error) {
        // Log the specific database error and re-throw it
        console.error('Error fetching max position for block:', error);
        throw new Error(`Could not determine block position: ${error.message}`);
      }

      const maxPos = data && data.length > 0 ? data[0].pos : -1;
      return maxPos + 1;
    } catch (err) {
      console.error('Error in getNextBlockPosition:', err);
      // Re-throw the error to be handled by the calling code.
      // This prevents using an unreliable fallback.
      throw err;
    }
  }
}
