
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

    // Create a unique channel name with timestamp to avoid conflicts
    const channelName = `presence_${pageId}_${user.id}_${Date.now()}`;
    
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
      )
      .subscribe((status) => {
        console.log('Presence subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          channelRef.current = null;
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or page change
    return cleanup;
  }, [user?.id, pageId]); // Added user.id to dependencies to ensure proper cleanup

  return { cleanup };
}
