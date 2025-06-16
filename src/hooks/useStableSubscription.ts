
import { useRef, useCallback, useEffect } from 'react';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';

interface SubscriptionConfig {
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
}

export function useStableSubscription(
  config: SubscriptionConfig | null,
  onUpdate: (payload: any) => void,
  dependencies: any[] = []
) {
  const { subscribe } = useRealtimeSubscriptions();
  const callbackRef = useRef(onUpdate);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Keep callback reference up to date
  callbackRef.current = onUpdate;

  const createSubscription = useCallback(() => {
    if (!config) return;

    console.log('📡 Creating stable subscription for:', config);

    // Clean up existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Create new subscription with the proper config format
    const subscriptionConfig = {
      table: config.table,
      filter: config.filter,
      event: config.event || '*' as const
    };

    const unsubscribe = subscribe(subscriptionConfig, (payload) => {
      callbackRef.current(payload);
    });

    unsubscribeRef.current = unsubscribe;
  }, [config, subscribe]);

  useEffect(() => {
    createSubscription();
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [createSubscription, ...dependencies]);

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  return { cleanup };
}
