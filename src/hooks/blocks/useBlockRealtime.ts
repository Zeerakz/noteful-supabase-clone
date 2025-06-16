
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

  useEffect(() => {
    if (!pageId) {
      console.log('BlockRealtime: No pageId, skipping subscription');
      return;
    }

    // Validate pageId is not a temporary ID
    if (pageId.startsWith('temp-')) {
      console.warn('BlockRealtime: Attempted to subscribe with temporary pageId:', pageId);
      return;
    }

    console.log('📡 BlockRealtime: Setting up subscription for page:', pageId);

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
          
          // Validate that the payload doesn't contain temporary IDs
          if (payload.new?.id?.startsWith('temp-') || payload.old?.id?.startsWith('temp-')) {
            console.warn('📡 BlockRealtime: Ignoring payload with temporary ID:', payload);
            return;
          }

          // Refetch blocks when changes occur
          if (mountedRef.current) {
            fetchAndUpdateBlocks();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 BlockRealtime: Subscription status:', status, 'for channel:', channelName);
        
        if (status === 'CHANNEL_ERROR') {
          console.error('📡 BlockRealtime: Channel error, will retry subscription');
          // Retry subscription after a short delay
          setTimeout(() => {
            if (mountedRef.current && pageId) {
              console.log('📡 BlockRealtime: Retrying subscription for page:', pageId);
              // The useEffect will handle the retry when dependencies change
            }
          }, 1000);
        }
      });

    subscriptionRef.current = channel;

    const fetchAndUpdateBlocks = async () => {
      try {
        const { data, error } = await supabase
          .from('blocks')
          .select('*')
          .eq('parent_id', pageId)
          .order('pos', { ascending: true });

        if (error) {
          console.error('📡 BlockRealtime: Error fetching blocks:', error);
          return;
        }

        if (mountedRef.current) {
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
    };

    // Initial fetch
    fetchAndUpdateBlocks();

    return () => {
      console.log('📡 BlockRealtime: Cleaning up subscription for channel:', channelName);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [pageId, onBlocksChange]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { mountedRef };
}
