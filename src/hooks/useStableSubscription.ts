import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionConfig {
  table: string;
  filter?: string;
}

export function useStableSubscription(
  config: SubscriptionConfig | null,
  callback: (payload: any) => void,
  deps: any[]
) {
  const channelRef = useRef<any>(null);
  const callbackRef = useRef(callback);

  // Keep callback current
  callbackRef.current = callback;

  const setupSubscription = useCallback(() => {
    if (!config) return;

    // Clean up existing subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `stable_${config.table}_${Date.now()}`;
    const channel = supabase.channel(channelName);

    const subscriptionOptions: any = {
      event: '*',
      schema: 'public',
      table: config.table,
    };

    if (config.filter) {
      subscriptionOptions.filter = config.filter;
    }

    channel
      .on('postgres_changes' as any, subscriptionOptions, (payload: any) => {
        callbackRef.current(payload);
      })
      .subscribe();

    channelRef.current = channel;
  }, [config?.table, config?.filter]);

  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupSubscription, ...deps]);

  return {
    cleanup: () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  };
}
