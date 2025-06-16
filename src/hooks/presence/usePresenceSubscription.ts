
import { useRef, useEffect, useCallback } from 'react';
import { useStableSubscription } from '@/hooks/useStableSubscription';

export function usePresenceSubscription(
  user: any,
  pageId: string | undefined,
  onPresenceUpdate: () => void
) {
  const handlePresenceUpdate = useCallback((payload: any) => {
    console.log('Realtime presence update:', payload);
    onPresenceUpdate();
  }, [onPresenceUpdate]);

  // Set up realtime subscription
  const subscriptionConfig = user && pageId ? {
    table: 'presence',
    filter: `page_id=eq.${pageId}`,
  } : null;

  const { cleanup } = useStableSubscription(subscriptionConfig, handlePresenceUpdate, [user?.id, pageId]);

  return { cleanup };
}
