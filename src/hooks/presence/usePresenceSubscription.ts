
import { useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePresenceSubscription(
  user: any,
  pageId: string | undefined,
  onPresenceUpdate: () => void
) {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);

  const cleanup = () => {
    if (channelRef.current && isSubscribedRef.current) {
      console.log('Cleaning up presence channel subscription');
      try {
        supabase.removeChannel(channelRef.current);
        isSubscribedRef.current = false;
      } catch (error) {
        console.warn('Error removing presence channel:', error);
      }
      channelRef.current = null;
    }
  };

  useEffect(() => {
    if (!user || !pageId) {
      cleanup();
      return;
    }

    // Cleanup any existing subscription first
    cleanup();

    // Create a unique channel name
    const timestamp = Date.now();
    const channelName = `presence_${pageId}_${user.id}_${timestamp}`;
    
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
      console.log('Presence subscription status:', status);
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
  }, [user?.id, pageId, onPresenceUpdate]);

  return { cleanup };
}
