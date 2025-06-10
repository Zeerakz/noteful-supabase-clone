
import { supabase } from '@/integrations/supabase/client';
import { CursorPosition, ActiveUser } from '@/types/presence';
import { SupabasePresenceData } from './types';

export const updateCursorPosition = async (
  user: any,
  pageId: string,
  x: number,
  y: number,
  cursorPositionRef: React.MutableRefObject<CursorPosition | null>,
  blockId?: string
) => {
  if (!user || !pageId) return;

  cursorPositionRef.current = { x, y, blockId };

  try {
    // Use upsert with conflict resolution on the unique constraint
    const { error } = await supabase
      .from('presence')
      .upsert({
        page_id: pageId,
        user_id: user.id,
        cursor: { x, y, blockId } as any,
        last_heartbeat: new Date().toISOString(),
      }, {
        onConflict: 'page_id,user_id'
      });

    if (error) {
      console.error('Error updating cursor position:', error);
    }
  } catch (err) {
    console.error('Failed to update cursor position:', err);
  }
};

export const sendHeartbeat = async (
  user: any,
  pageId: string,
  cursorPositionRef: React.MutableRefObject<CursorPosition | null>
) => {
  if (!user || !pageId) return;

  try {
    // Use upsert with conflict resolution on the unique constraint
    const { error } = await supabase
      .from('presence')
      .upsert({
        page_id: pageId,
        user_id: user.id,
        cursor: cursorPositionRef.current as any,
        last_heartbeat: new Date().toISOString(),
      }, {
        onConflict: 'page_id,user_id'
      });

    if (error) {
      console.error('Error sending heartbeat:', error);
    }
  } catch (err) {
    console.error('Failed to send heartbeat:', err);
  }
};

export const fetchActiveUsers = async (
  pageId: string,
  userId?: string
): Promise<ActiveUser[]> => {
  if (!pageId) return [];

  try {
    // Clean up old presence records first
    await supabase.rpc('cleanup_old_presence');

    const { data, error } = await supabase
      .from('presence')
      .select('*')
      .eq('page_id', pageId)
      .gte('last_heartbeat', new Date(Date.now() - 30000).toISOString()); // Within last 30 seconds

    if (error) throw error;

    const users: ActiveUser[] = data?.map((presence: SupabasePresenceData) => {
      // Safely parse the cursor data
      let cursor: CursorPosition | undefined;
      if (presence.cursor && typeof presence.cursor === 'object') {
        const cursorData = presence.cursor as any;
        if (typeof cursorData.x === 'number' && typeof cursorData.y === 'number') {
          cursor = {
            x: cursorData.x,
            y: cursorData.y,
            blockId: cursorData.blockId
          };
        }
      }

      return {
        user_id: presence.user_id,
        cursor,
        last_heartbeat: presence.last_heartbeat,
      };
    }) || [];

    // Filter out current user from the active users list
    return users.filter(u => u.user_id !== userId);
  } catch (err) {
    console.error('Failed to fetch active users:', err);
    return [];
  }
};

export const cleanupPresence = async (user: any, pageId: string) => {
  if (!user || !pageId) return;

  try {
    await supabase
      .from('presence')
      .delete()
      .eq('page_id', pageId)
      .eq('user_id', user.id);
  } catch (err) {
    console.error('Failed to cleanup presence:', err);
  }
};
