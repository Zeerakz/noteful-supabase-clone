
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Block } from './types';
import { normalizeBlock } from '@/services/blocks/blockNormalizationService';
import { useStableSubscription } from '@/hooks/useStableSubscription';

interface UseBlockRealtimeProps {
  pageId?: string;
  onBlocksChange: (blocks: Block[]) => void;
}

export function useBlockRealtime({ pageId, onBlocksChange }: UseBlockRealtimeProps) {
  const mountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const pendingFetchRef = useRef<boolean>(false);

  // Debounced fetch function to prevent excessive database calls
  const fetchAndUpdateBlocks = async () => {
    if (!pageId || !mountedRef.current || pendingFetchRef.current) {
      return;
    }

    // Debounce: Only fetch if it's been at least 100ms since last fetch
    const now = Date.now();
    if (now - lastFetchRef.current < 100) {
      return;
    }

    pendingFetchRef.current = true;
    lastFetchRef.current = now;

    try {
      console.log('📡 BlockRealtime: Fetching updated blocks for page:', pageId);
      
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
        
        // Filter out any blocks with temporary IDs (safety check)
        const validBlocks = normalizedBlocks.filter(block => {
          if (block.id.startsWith('temp-')) {
            console.warn('📡 BlockRealtime: Filtered out block with temporary ID:', block.id);
            return false;
          }
          return true;
        });
        
        console.log(`📡 BlockRealtime: Updated ${validBlocks.length} blocks`);
        onBlocksChange(validBlocks);
      }
    } catch (err) {
      console.error('📡 BlockRealtime: Unexpected error fetching blocks:', err);
    } finally {
      pendingFetchRef.current = false;
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    if (!mountedRef.current) return;
    
    console.log('📡 BlockRealtime: Received payload:', payload);
    
    // Safely check for temporary IDs with proper type checking
    const newRecord = payload.new as any;
    const oldRecord = payload.old as any;
    
    if ((newRecord?.id && typeof newRecord.id === 'string' && newRecord.id.startsWith('temp-')) || 
        (oldRecord?.id && typeof oldRecord.id === 'string' && oldRecord.id.startsWith('temp-'))) {
      console.warn('📡 BlockRealtime: Ignoring payload with temporary ID:', payload);
      return;
    }

    // Use a small delay to allow for immediate optimistic updates to settle
    // This prevents conflicts between optimistic updates and realtime updates
    setTimeout(() => {
      if (mountedRef.current) {
        fetchAndUpdateBlocks();
      }
    }, 50);
  };

  // Set up realtime subscription with enhanced error handling
  const subscriptionConfig = pageId && !pageId.startsWith('temp-') ? {
    table: 'blocks',
    filter: `parent_id=eq.${pageId}`,
  } : null;

  const { connectionStatus, reconnect } = useStableSubscription(
    subscriptionConfig, 
    handleRealtimeUpdate, 
    [pageId]
  );

  // Initial fetch when page changes
  useEffect(() => {
    if (pageId && !pageId.startsWith('temp-')) {
      console.log('📡 BlockRealtime: Initial fetch for page:', pageId);
      fetchAndUpdateBlocks();
    }
  }, [pageId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { 
    mountedRef, 
    connectionStatus,
    reconnect 
  };
}
