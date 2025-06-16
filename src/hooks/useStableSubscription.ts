
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
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const cleanup = useCallback(() => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('🧹 Cleaning up subscription:', configRef.current);
        // Add null check before calling unsubscribe
        if (channelRef.current && typeof channelRef.current.unsubscribe === 'function') {
          channelRef.current.unsubscribe();
        }
        // Add null check before calling removeChannel
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
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

    // Cleanup existing subscription
    cleanup();
    configRef.current = configString;

    // Create unique channel name with better randomness
    const channelName = `${config.table}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    console.log('📡 Creating subscription:', channelName);

    try {
      const channel = supabase.channel(channelName);
      
      // Ensure we have a valid channel before proceeding
      if (!channel) {
        console.error('❌ Failed to create Supabase channel');
        return;
      }

      // Use the correct Supabase v2 syntax with better error handling
      const subscription = channel.on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter }),
        },
        (payload) => {
          console.log('📨 Subscription update received:', payload);
          
          try {
            // Create a normalized payload with eventType for backward compatibility
            const normalizedPayload = {
              ...payload,
              eventType: payload.event || 'unknown'
            };
            
            console.log('📨 Normalized payload:', normalizedPayload.eventType, 'for', config.table);
            onUpdate(normalizedPayload);
            
            // Reset retry count on successful message
            retryCountRef.current = 0;
          } catch (error) {
            console.error('❌ Error processing subscription payload:', error);
          }
        }
      );

      subscription.subscribe((status) => {
        console.log('📡 Subscription status:', status, 'for', channelName);
        
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          retryCountRef.current = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          
          if (channelRef.current === channel) {
            channelRef.current = null;
          }
          
          // Retry logic with exponential backoff
          if (retryCountRef.current < maxRetries) {
            const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // 1s, 2s, 4s
            retryCountRef.current++;
            
            console.log(`🔄 Retrying subscription in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
            
            setTimeout(() => {
              if (configRef.current === configString) { // Only retry if config hasn't changed
                createSubscription();
              }
            }, retryDelay);
          } else {
            console.error('❌ Max retries reached for subscription:', channelName);
          }
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      
      // Retry after a delay if we haven't exceeded max retries
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => createSubscription(), 2000);
      }
    }
  }, [config, onUpdate, cleanup]);

  useEffect(() => {
    retryCountRef.current = 0; // Reset retry count on dependency change
    createSubscription();
    return cleanup;
  }, [createSubscription, ...dependencies]);

  return { cleanup };
}
