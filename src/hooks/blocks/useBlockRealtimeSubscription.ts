
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Block } from './types';

interface UseBlockRealtimeSubscriptionParams {
  pageId?: string;
  onBlockInsert: (block: Block) => void;
  onBlockUpdate: (block: Block) => void;
  onBlockDelete: (block: Block) => void;
}

export function useBlockRealtimeSubscription({
  pageId,
  onBlockInsert,
  onBlockUpdate,
  onBlockDelete,
}: UseBlockRealtimeSubscriptionParams) {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);

  const cleanup = () => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('Cleaning up blocks channel subscription');
        supabase.removeChannel(channelRef.current);
        isSubscribedRef.current = false;
      } catch (error) {
        console.warn('Error removing blocks channel:', error);
      }
      channelRef.current = null;
    }
  };

  useEffect(() => {
    if (!pageId || !user) {
      cleanup();
      return;
    }

    // Cleanup existing subscription
    cleanup();

    // Create unique channel name
    const timestamp = Date.now();
    const channelName = `blocks_${pageId}_${user.id}_${timestamp}`;
    console.log('Creating blocks channel:', channelName);

    // Create a new channel instance
    const channel = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blocks',
        filter: `page_id=eq.${pageId}`
      },
      (payload) => {
        console.log('Realtime block update:', payload);
        
        if (payload.eventType === 'INSERT') {
          onBlockInsert(payload.new as Block);
        } else if (payload.eventType === 'UPDATE') {
          onBlockUpdate(payload.new as Block);
        } else if (payload.eventType === 'DELETE') {
          onBlockDelete(payload.old as Block);
        }
      }
    );

    // Subscribe only once and track status
    channel.subscribe((status) => {
      console.log('Blocks subscription status:', status);
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

    return cleanup;
  }, [user?.id, pageId, onBlockInsert, onBlockUpdate, onBlockDelete]);

  return { cleanup };
}
