
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Block } from './types';
import { normalizeBlock } from '@/services/blocks/blockNormalizationService';

interface UseBlockRealtimeProps {
  pageId?: string;
  onBlocksChange: (blocks: Block[]) => void;
}

export function useBlockRealtime({ pageId, onBlocksChange }: UseBlockRealtimeProps) {
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<any>(null);
  const lastPageIdRef = useRef<string | undefined>(pageId);
  const isSubscribingRef = useRef(false);

  const fetchAndUpdateBlocks = useRef(async (currentPageId: string) => {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('parent_id', currentPageId)
        .order('pos', { ascending: true });

      if (error) {
        console.error('📡 BlockRealtime: Error fetching blocks:', error);
        return;
      }

      if (mountedRef.current && lastPageIdRef.current === currentPageId) {
        const normalizedBlocks = (data || []).map(normalizeBlock);
        
        // Filter out any blocks with temporary IDs (shouldn't happen but safety check)
        const validBlocks = normalizedBlocks.filter(block => {
          if (block.id.startsWith('temp-')) {
            console.warn('📡 BlockRealtime: Filtered out block with temporary ID:', block.id);
            return false;
          }
          return true;
        });
        
        onBlocksChange(validBlocks);
      }
    } catch (err) {
      console.error('📡 BlockRealtime: Unexpected error fetching blocks:', err);
    }
  });

  const cleanup = useRef(() => {
    console.log('📡 BlockRealtime: Cleaning up subscription for page:', lastPageIdRef.current);
    if (subscriptionRef.current) {
      try {
        supabase.removeChannel(subscriptionRef.current);
      } catch (error) {
        console.warn('📡 BlockRealtime: Warning during cleanup:', error);
      }
      subscriptionRef.current = null;
    }
    isSubscribingRef.current = false;
  });

  useEffect(() => {
    if (!pageId) {
      console.log('📡 BlockRealtime: No pageId, cleaning up subscription');
      cleanup.current();
      return;
    }

    // Validate pageId is not a temporary ID
    if (pageId.startsWith('temp-')) {
      console.warn('📡 BlockRealtime: Attempted to subscribe with temporary pageId:', pageId);
      return;
    }

    // If pageId changed, cleanup and create new subscription
    if (lastPageIdRef.current !== pageId) {
      cleanup.current();
      lastPageIdRef.current = pageId;
    }

    // Don't create subscription if already subscribing or already subscribed to this page
    if (isSubscribingRef.current || (subscriptionRef.current && lastPageIdRef.current === pageId)) {
      return;
    }

    console.log('📡 BlockRealtime: Setting up subscription for page:', pageId);
    isSubscribingRef.current = true;

    const channelName = `blocks_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `parent_id=eq.${pageId}`,
        },
        (payload) => {
          console.log('📡 BlockRealtime: Received payload:', payload);
          
          // Safely check for temporary IDs with proper type checking
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          if ((newRecord?.id && typeof newRecord.id === 'string' && newRecord.id.startsWith('temp-')) || 
              (oldRecord?.id && typeof oldRecord.id === 'string' && oldRecord.id.startsWith('temp-'))) {
            console.warn('📡 BlockRealtime: Ignoring payload with temporary ID:', payload);
            return;
          }

          // Only process if we're still mounted and this is for the current page
          if (mountedRef.current && lastPageIdRef.current === pageId) {
            // Add a small delay to avoid race conditions with optimistic updates
            setTimeout(() => {
              if (mountedRef.current && lastPageIdRef.current === pageId) {
                fetchAndUpdateBlocks.current(pageId);
              }
            }, 50);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 BlockRealtime: Subscription status:', status, 'for channel:', channelName);
        
        if (status === 'SUBSCRIBED' && lastPageIdRef.current === pageId) {
          isSubscribingRef.current = false;
          subscriptionRef.current = channel;
          // Initial fetch after successful subscription
          fetchAndUpdateBlocks.current(pageId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('📡 BlockRealtime: Channel error, will retry subscription');
          isSubscribingRef.current = false;
          // Retry subscription after a delay
          setTimeout(() => {
            if (mountedRef.current && lastPageIdRef.current === pageId) {
              console.log('📡 BlockRealtime: Retrying subscription for page:', pageId);
              // Trigger effect to retry
              lastPageIdRef.current = undefined;
            }
          }, 1000);
        } else if (status === 'CLOSED') {
          isSubscribingRef.current = false;
          if (subscriptionRef.current === channel) {
            subscriptionRef.current = null;
          }
        }
      });

    return cleanup.current;
  }, [pageId, onBlocksChange]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup.current();
    };
  }, []);

  return { mountedRef };
}
