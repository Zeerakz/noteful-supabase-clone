
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStableSubscription } from '@/hooks/useStableSubscription';
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

  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Realtime block update:', payload);
    
    if (payload.eventType === 'INSERT') {
      onBlockInsert(payload.new as Block);
    } else if (payload.eventType === 'UPDATE') {
      onBlockUpdate(payload.new as Block);
    } else if (payload.eventType === 'DELETE') {
      onBlockDelete(payload.old as Block);
    }
  }, [onBlockInsert, onBlockUpdate, onBlockDelete]);

  // Set up realtime subscription
  const subscriptionConfig = pageId && user ? {
    table: 'blocks',
    filter: `parent_id=eq.${pageId}`,
  } : null;

  useStableSubscription(subscriptionConfig, handleRealtimeUpdate, [pageId, user?.id]);

  return {};
}
