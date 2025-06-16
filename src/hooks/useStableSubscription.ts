
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
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    // Clear any pending cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('🧹 Cleaning up subscription:', configRef.current);
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Warning during subscription cleanup:', error);
      } finally {
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    }
  }, []);

  const createSubscription = useCallback(() => {
    if (!config) return;

    const configString = JSON.stringify(config);
    
    // Don't recreate if config hasn't changed and subscription is active
    if (configRef.current === configString && channelRef.current && isSubscribedRef.current) {
      return;
    }

    // Cleanup existing subscription with a slight delay to prevent race conditions
    if (channelRef.current) {
      cleanup();
      // Small delay to ensure cleanup completes before creating new subscription
      cleanupTimeoutRef.current = setTimeout(() => {
        createNewSubscription(configString);
      }, 100);
    } else {
      createNewSubscription(configString);
    }
  }, [config, onUpdate, cleanup]);

  const createNewSubscription = useCallback((configString: string) => {
    if (!config) return;

    configRef.current = configString;

    // Create unique channel name with better randomization
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
          // Only process if this is still the active subscription
          if (channelRef.current === channel && isSubscribedRef.current) {
            console.log('📨 Subscription update received:', payload);
            
            // Create a normalized payload with eventType for backward compatibility
            const normalizedPayload = {
              ...payload,
              eventType: payload.event || 'unknown'
            };
            
            console.log('📨 Processing payload:', normalizedPayload.eventType, 'for', config.table);
            onUpdate(normalizedPayload);
          }
        }
      );

      subscription.subscribe((status) => {
        console.log('📡 Subscription status:', status, 'for', channelName);
        if (status === 'SUBSCRIBED' && channelRef.current === channel) {
          isSubscribedRef.current = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          if (channelRef.current === channel) {
            isSubscribedRef.current = false;
            channelRef.current = null;
          }
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
    }
  }, [config, onUpdate]);

  useEffect(() => {
    createSubscription();
    return cleanup;
  }, [createSubscription, ...dependencies]);

  return { cleanup };
}
