
import { useCallback, useRef } from 'react';
import { useStableSubscription } from '@/hooks/useStableSubscription';
import { Block } from './types';
import { normalizeBlock } from '@/services/blockOperationsService';

interface UseBlockRealtimeProps {
  pageId?: string;
  onBlocksChange: (updater: (prev: Block[]) => Block[]) => void;
}

export function useBlockRealtime({ pageId, onBlocksChange }: UseBlockRealtimeProps) {
  const mountedRef = useRef(true);

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (!mountedRef.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    onBlocksChange(prev => {
      switch (eventType) {
        case 'INSERT':
          const newBlock = normalizeBlock(newRecord);
          if (prev.some(block => block.id === newBlock.id)) {
            return prev;
          }
          return [...prev, newBlock].sort((a, b) => (a.pos || 0) - (b.pos || 0));

        case 'UPDATE':
          const updatedBlock = normalizeBlock(newRecord);
          return prev.map(block => 
            block.id === updatedBlock.id ? updatedBlock : block
          ).sort((a, b) => (a.pos || 0) - (b.pos || 0));

        case 'DELETE':
          const deletedBlock = oldRecord;
          return prev.filter(block => block.id !== deletedBlock.id);

        default:
          return prev;
      }
    });
  }, [onBlocksChange]);

  // Set up realtime subscription
  const subscriptionConfig = pageId ? {
    table: 'blocks',
    filter: `parent_id=eq.${pageId}`,
  } : null;

  useStableSubscription(subscriptionConfig, handleRealtimeUpdate, [pageId]);

  return { mountedRef };
}
