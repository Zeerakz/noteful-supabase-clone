
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';
import { supabase } from '@/integrations/supabase/client';
import { PresenceActivity, CursorPosition } from '@/types/presence';

interface ActiveUser {
  user_id: string;
  cursor?: CursorPosition;
  activity: PresenceActivity;
  last_heartbeat: string;
}

export function usePresence(pageId?: string) {
  const { user } = useAuth();
  const { subscribeToPage } = useRealtimeManager();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  const handlePresenceChange = useCallback((payload: any) => {
    console.log('👥 Presence change:', payload);
    
    if (payload.type === 'join') {
      // Handle user joining
      const newUsers = payload.newPresences || [];
      setActiveUsers(prev => {
        const filtered = prev.filter(u => !newUsers.some((nu: any) => nu.user_id === u.user_id));
        return [...filtered, ...newUsers];
      });
    } else if (payload.type === 'leave') {
      // Handle user leaving
      const leftUsers = payload.leftPresences || [];
      setActiveUsers(prev => 
        prev.filter(u => !leftUsers.some((lu: any) => lu.user_id === u.user_id))
      );
    } else {
      // Handle sync - full presence state
      const presenceState = payload;
      const users: ActiveUser[] = [];
      
      Object.keys(presenceState).forEach(key => {
        const presences = presenceState[key];
        if (presences && presences.length > 0) {
          const presence = presences[0]; // Take the first presence for each user
          users.push({
            user_id: presence.user_id,
            cursor: presence.cursor,
            activity: presence.activity || 'viewing',
            last_heartbeat: presence.last_heartbeat
          });
        }
      });
      
      setActiveUsers(users);
    }
    setLoading(false);
  }, []);

  const updateCursorPosition = useCallback(async (x: number, y: number, blockId?: string) => {
    if (!pageId || !user) return;

    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          page_id: pageId,
          user_id: user.id,
          cursor: { x, y, blockId } as any,
          activity: 'viewing' as PresenceActivity,
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
  }, [pageId, user]);

  const updateActivity = useCallback(async (activity: PresenceActivity) => {
    if (!pageId || !user) return;

    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          page_id: pageId,
          user_id: user.id,
          activity: activity,
          last_heartbeat: new Date().toISOString(),
        }, {
          onConflict: 'page_id,user_id',
        });

      if (error) {
        console.error('Error updating activity:', error);
      }
    } catch (err) {
      console.error('Failed to update activity:', err);
    }
  }, [pageId, user]);

  const sendHeartbeat = useCallback(async () => {
    if (!pageId || !user) return;

    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          page_id: pageId,
          user_id: user.id,
          activity: 'viewing' as PresenceActivity,
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
  }, [pageId, user]);

  // Track our own presence
  useEffect(() => {
    if (!pageId || !user) return;

    let presenceRef: any = null;

    const trackPresence = async () => {
      try {
        // Get user profile for presence data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        // Use the centralized realtime manager
        const unsubscribe = subscribeToPage(pageId, handlePresenceChange);

        // Track our presence using the presence table
        const { data: presenceData, error } = await supabase
          .from('presence')
          .upsert({
            page_id: pageId,
            user_id: user.id,
            activity: 'viewing' as PresenceActivity,
            last_heartbeat: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error tracking presence:', error);
        } else {
          presenceRef = presenceData;
        }

        // Set up heartbeat
        const heartbeatInterval = setInterval(async () => {
          await supabase
            .from('presence')
            .upsert({
              page_id: pageId,
              user_id: user.id,
              activity: 'viewing' as PresenceActivity,
              last_heartbeat: new Date().toISOString()
            });
        }, 30000); // Update every 30 seconds

        return () => {
          clearInterval(heartbeatInterval);
          unsubscribe();
          
          // Remove our presence when leaving
          if (presenceRef) {
            supabase
              .from('presence')
              .delete()
              .eq('id', presenceRef.id)
              .then(() => console.log('🚪 Presence removed'));
          }
        };
      } catch (error) {
        console.error('Error setting up presence:', error);
        setLoading(false);
      }
    };

    const cleanup = trackPresence();
    
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then(fn => fn && fn());
      }
    };
  }, [pageId, user, subscribeToPage, handlePresenceChange]);

  return {
    activeUsers: activeUsers.filter(u => u.user_id !== user?.id), // Exclude current user
    loading,
    updateCursorPosition,
    updateActivity,
    sendHeartbeat
  };
}
