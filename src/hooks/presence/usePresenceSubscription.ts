
import { useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePresenceSubscription(
  user: any,
  pageId: string | undefined,
  onPresenceUpdate: () => void
) {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const subscriptionAttemptRef = useRef<number>(0);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = () => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (channelRef.current && isSubscribedRef.current) {
      console.log('Cleaning up presence channel subscription');
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  useEffect(() => {
    if (!user || !pageId) {
      cleanup();
      return;
    }

    // Cleanup any existing subscription first
    cleanup();

    // Add a small delay to ensure cleanup is complete
    cleanupTimeoutRef.current = setTimeout(() => {
      // Increment attempt counter to ensure unique channel names
      subscriptionAttemptRef.current += 1;
      const attemptId = subscriptionAttemptRef.current;
      const timestamp = Date.now();

      // Create a highly unique channel name
      const channelName = `presence_${pageId}_${user.id}_${attemptId}_${timestamp}`;
      
      console.log('Creating presence channel:', channelName);
      
      // Create a completely new channel instance
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
    }, 100);

    // Cleanup on unmount or dependencies change
    return cleanup;
  }, [user?.id, pageId, onPresenceUpdate]);

  return { cleanup };
}
