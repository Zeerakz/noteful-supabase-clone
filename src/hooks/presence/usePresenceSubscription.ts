
import { useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePresenceSubscription(
  user: any,
  pageId: string | undefined,
  onPresenceUpdate: () => void
) {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const pageIdRef = useRef<string | undefined>(pageId);

  const cleanup = useCallback(() => {
    if (channelRef.current && isSubscribedRef.current) {
      console.log('Cleaning up presence channel subscription');
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        isSubscribedRef.current = false;
      } catch (error) {
        console.warn('Error removing presence channel:', error);
      }
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!user || !pageId) {
      cleanup();
      return;
    }

    // Only create new subscription if page changed
    if (pageIdRef.current === pageId && channelRef.current && isSubscribedRef.current) {
      return;
    }

    // Cleanup any existing subscription first
    cleanup();
    pageIdRef.current = pageId;

    // Create a unique channel name with random component to avoid conflicts
    const randomId = Math.random().toString(36).substring(7);
    const channelName = `presence:${pageId}:${user.id}:${randomId}`;
    
    console.log('Creating presence channel:', channelName);
    
    // Create a new channel instance
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Set up postgres changes listener
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'presence',
        filter: `page_id=eq.${pageId}`,
      },
      (payload) => {
        console.log('Realtime presence update:', payload);
        onPresenceUpdate();
      }
    );

    // Subscribe only once and track status
    channel.subscribe((status) => {
      console.log('Presence subscription status:', status, 'for channel:', channelName);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount or dependencies change
    return cleanup;
  }, [user?.id, pageId, onPresenceUpdate, cleanup]);

  return { cleanup };
}
