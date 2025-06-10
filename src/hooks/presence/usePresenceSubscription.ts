
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

  const cleanup = () => {
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

    // Increment attempt counter to ensure unique channel names
    subscriptionAttemptRef.current += 1;
    const attemptId = subscriptionAttemptRef.current;

    // Create a unique channel name with user ID and attempt counter
    const channelName = `presence_${pageId}_${user.id}_${attemptId}`;
    
    console.log('Creating presence channel:', channelName);
    
    // Set up realtime subscription for presence updates
    const channel = supabase
      .channel(channelName)
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
          onPresenceUpdate(); // Refresh active users list
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

    // Cleanup on unmount or page change
    return cleanup;
  }, [user?.id, pageId]); // Added user.id to dependencies to ensure proper cleanup

  return { cleanup };
}
