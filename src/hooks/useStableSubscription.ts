
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const configRef = useRef<string>('');

  const cleanup = useCallback(() => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('🧹 Cleaning up subscription:', configRef.current);
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Warning during subscription cleanup:', error);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  }, []);

  const createSubscription = useCallback(() => {
    if (!config) return;

    const configString = JSON.stringify(config);
    
    // Don't recreate if config hasn't changed
    if (configRef.current === configString && channelRef.current && isSubscribedRef.current) {
      return;
    }

    // Cleanup existing subscription
    cleanup();
    configRef.current = configString;

    // Create unique channel name
    const channelName = `${config.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('📡 Creating subscription:', channelName);

    try {
      const channel = supabase.channel(channelName);
      
      // Use the correct Supabase v2 syntax
      const subscription = channel.on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter }),
        },
        (payload) => {
          console.log('📨 Subscription update:', payload.eventType, 'for', config.table);
          onUpdate(payload);
        }
      );

      subscription.subscribe((status) => {
        console.log('📡 Subscription status:', status, 'for', channelName);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          if (channelRef.current === channel) {
            channelRef.current = null;
          }
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
    }
  }, [config, onUpdate, cleanup]);

  useEffect(() => {
    createSubscription();
    return cleanup;
  }, [createSubscription, ...dependencies]);

  return { cleanup };
}
