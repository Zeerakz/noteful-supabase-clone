
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PresenceData {
  id: string;
  page_id: string;
  user_id: string;
  cursor?: {
    x: number;
    y: number;
    blockId?: string;
  };
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
}

interface ActiveUser {
  user_id: string;
  cursor?: {
    x: number;
    y: number;
    blockId?: string;
  };
  last_heartbeat: string;
}

export function usePresence(pageId?: string) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cursorPositionRef = useRef<{ x: number; y: number; blockId?: string } | null>(null);

  const updateCursorPosition = async (x: number, y: number, blockId?: string) => {
    if (!user || !pageId) return;

    cursorPositionRef.current = { x, y, blockId };

    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          page_id: pageId,
          user_id: user.id,
          cursor: { x, y, blockId },
          last_heartbeat: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating cursor position:', error);
      }
    } catch (err) {
      console.error('Failed to update cursor position:', err);
    }
  };

  const sendHeartbeat = async () => {
    if (!user || !pageId) return;

    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          page_id: pageId,
          user_id: user.id,
          cursor: cursorPositionRef.current,
          last_heartbeat: new Date().toISOString(),
        });

      if (error) {
        console.error('Error sending heartbeat:', error);
      }
    } catch (err) {
      console.error('Failed to send heartbeat:', err);
    }
  };

  const fetchActiveUsers = async () => {
    if (!pageId) {
      setActiveUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Clean up old presence records first
      await supabase.rpc('cleanup_old_presence');

      const { data, error } = await supabase
        .from('presence')
        .select('*')
        .eq('page_id', pageId)
        .gte('last_heartbeat', new Date(Date.now() - 30000).toISOString()); // Within last 30 seconds

      if (error) throw error;

      const users: ActiveUser[] = data?.map((presence: PresenceData) => ({
        user_id: presence.user_id,
        cursor: presence.cursor,
        last_heartbeat: presence.last_heartbeat,
      })) || [];

      // Filter out current user from the active users list
      setActiveUsers(users.filter(u => u.user_id !== user?.id));
    } catch (err) {
      console.error('Failed to fetch active users:', err);
    } finally {
      setLoading(false);
    }
  };

  const cleanupPresence = async () => {
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

  useEffect(() => {
    if (!user || !pageId) {
      setActiveUsers([]);
      setLoading(false);
      return;
    }

    fetchActiveUsers();

    // Set up realtime subscription for presence updates
    const channel = supabase
      .channel(`presence-${pageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `page_id=eq.${pageId}`,
        },
        (payload) => {
          console.log('Realtime presence update:', payload);
          fetchActiveUsers(); // Refresh active users list
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Start heartbeat to maintain presence
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 5000); // Every 5 seconds

    // Cleanup on unmount or page change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      cleanupPresence();
    };
  }, [user, pageId]);

  // Cleanup presence when user navigates away or closes tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupPresence();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupPresence();
      } else if (!document.hidden && user && pageId) {
        // Re-establish presence when tab becomes visible again
        sendHeartbeat();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, pageId]);

  return {
    activeUsers,
    loading,
    updateCursorPosition,
    sendHeartbeat,
  };
}
