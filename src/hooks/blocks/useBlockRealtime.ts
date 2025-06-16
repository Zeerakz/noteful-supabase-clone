
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
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

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
        
        console.log('📡 BlockRealtime: Fetched blocks:', validBlocks.length);
        onBlocksChange(validBlocks);
      }
    } catch (err) {
      console.error('📡 BlockRealtime: Unexpected error fetching blocks:', err);
    }
  });

  const cleanup = useRef(() => {
    console.log('📡 BlockRealtime: Cleaning up subscription for page:', lastPageIdRef.current);
    
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (subscriptionRef.current) {
      try {
        supabase.removeChannel(subscriptionRef.current);
      } catch (error) {
        console.warn('📡 BlockRealtime: Warning during cleanup:', error);
      }
      subscriptionRef.current = null;
    }
    
    isSubscribingRef.current = false;
    retryCountRef.current = 0;
  });

  const createSubscription = useRef((currentPageId: string, isRetry: boolean = false) => {
    if (isSubscribingRef.current || !currentPageId) return;
    
    console.log('📡 BlockRealtime: Setting up subscription for page:', currentPageId, isRetry ? `(retry ${retryCountRef.current})` : '');
    isSubscribingRef.current = true;

    // Add delay for retries with exponential backoff
    const delay = isRetry ? Math.min(1000 * Math.pow(2, retryCountRef.current), 5000) : 0;
    
    setTimeout(() => {
      if (!mountedRef.current || lastPageIdRef.current !== currentPageId) {
        isSubscribingRef.current = false;
        return;
      }

      const channelName = `blocks_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const channel = supabase
        .channel(channelName, {
          config: {
            presence: {
              key: `blocks_${currentPageId}_${Date.now()}`
            }
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `parent_id=eq.${currentPageId}`,
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
            if (mountedRef.current && lastPageIdRef.current === currentPageId) {
              // Add a small delay to avoid race conditions with optimistic updates
              setTimeout(() => {
                if (mountedRef.current && lastPageIdRef.current === currentPageId) {
                  fetchAndUpdateBlocks.current(currentPageId);
                }
              }, 100); // Increased delay to help with race conditions
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 BlockRealtime: Subscription status:', status, 'for channel:', channelName);
          
          if (status === 'SUBSCRIBED' && lastPageIdRef.current === currentPageId) {
            isSubscribingRef.current = false;
            subscriptionRef.current = channel;
            retryCountRef.current = 0; // Reset retry count on success
            // Initial fetch after successful subscription
            fetchAndUpdateBlocks.current(currentPageId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('📡 BlockRealtime: Channel error, will retry subscription');
            isSubscribingRef.current = false;
            
            // Retry with exponential backoff if we haven't exceeded max retries
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              console.log(`📡 BlockRealtime: Retrying subscription in ${Math.min(1000 * Math.pow(2, retryCountRef.current), 5000)}ms`);
              retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current && lastPageIdRef.current === currentPageId) {
                  createSubscription.current(currentPageId, true);
                }
              }, Math.min(1000 * Math.pow(2, retryCountRef.current), 5000));
            } else {
              console.error('📡 BlockRealtime: Max retries exceeded for page:', currentPageId);
              // Perform initial fetch even if subscription failed
              fetchAndUpdateBlocks.current(currentPageId);
            }
          } else if (status === 'CLOSED') {
            isSubscribingRef.current = false;
            if (subscriptionRef.current === channel) {
              subscriptionRef.current = null;
            }
          }
        });
    }, delay);
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

    createSubscription.current(pageId);

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
