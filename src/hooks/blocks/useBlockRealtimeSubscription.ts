
import { useEffect, useRef, useCallback } from 'react';
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
  const pageIdRef = useRef<string | undefined>(pageId);
  const isCleaningUpRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) {
      console.log('Cleanup already in progress, skipping...');
      return;
    }

    isCleaningUpRef.current = true;
    
    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('Cleaning up blocks channel subscription');
        const channel = channelRef.current;
        
        // Reset refs before cleanup to prevent race conditions
        channelRef.current = null;
        isSubscribedRef.current = false;
        
        // Now safely cleanup the channel
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error during blocks channel cleanup:', error);
      }
    }
    
    isCleaningUpRef.current = false;
  }, []);

  useEffect(() => {
    if (!pageId || !user) {
      cleanup();
      return;
    }

    // Only create new subscription if page changed
    if (pageIdRef.current === pageId && channelRef.current && isSubscribedRef.current) {
      return;
    }

    // Cleanup existing subscription
    cleanup();
    pageIdRef.current = pageId;

    // Create unique channel name with random component
    const randomId = Math.random().toString(36).substring(7);
    const channelName = `blocks:${pageId}:${user.id}:${randomId}`;
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

    // Store channel reference before subscribing
    channelRef.current = channel;

    // Subscribe only once and track status
    channel.subscribe((status) => {
      console.log('Blocks subscription status:', status, 'for channel:', channelName);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
        // Only reset channel ref if this is still the current channel
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
      }
    });

    return cleanup;
  }, [user?.id, pageId, onBlockInsert, onBlockUpdate, onBlockDelete, cleanup]);

  return { cleanup };
}
