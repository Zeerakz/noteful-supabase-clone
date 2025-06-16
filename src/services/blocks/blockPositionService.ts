
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

      if (error) throw error;

      const maxPos = data && data.length > 0 ? data[0].pos : -1;
      return maxPos + 1;
    } catch (err) {
      console.error('Error getting next block position:', err);
      // Fallback to a simple increment if query fails
      return Date.now() % 1000000; // Use modulo to keep within integer range
    }
  }
}
