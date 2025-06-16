
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
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const cleanup = useCallback(() => {
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
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
        retryCountRef.current = 0;
      }
    }
  }, []);

  const createSubscription = useCallback((isRetry: boolean = false) => {
    if (!config) return;

    const configString = JSON.stringify(config);
    
    // Don't recreate if config hasn't changed and subscription is active
    if (!isRetry && configRef.current === configString && channelRef.current && isSubscribedRef.current) {
      return;
    }

    // Cleanup existing subscription before creating new one
    if (channelRef.current) {
      cleanup();
    }

    configRef.current = configString;

    // Add exponential backoff for retries
    const baseDelay = isRetry ? Math.min(1000 * Math.pow(2, retryCountRef.current), 5000) : 0;
    
    setTimeout(() => {
      if (!config) return;

      // Create unique channel name with timestamp and random string
      const channelName = `${config.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('📡 Creating subscription:', channelName, isRetry ? `(retry ${retryCountRef.current})` : '');

      try {
        const channel = supabase.channel(channelName, {
          config: {
            presence: {
              key: `user_${Date.now()}`
            }
          }
        });
        
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
            retryCountRef.current = 0; // Reset retry count on success
          } else if (status === 'CLOSED') {
            if (channelRef.current === channel) {
              isSubscribedRef.current = false;
              channelRef.current = null;
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('📡 Channel error for:', channelName);
            if (channelRef.current === channel) {
              isSubscribedRef.current = false;
              channelRef.current = null;
              
              // Retry with exponential backoff if we haven't exceeded max retries
              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                console.log(`📡 Retrying subscription in ${Math.min(1000 * Math.pow(2, retryCountRef.current), 5000)}ms`);
                retryTimeoutRef.current = setTimeout(() => {
                  createSubscription(true);
                }, Math.min(1000 * Math.pow(2, retryCountRef.current), 5000));
              } else {
                console.error('📡 Max retries exceeded for subscription:', configString);
              }
            }
          }
        });

        channelRef.current = channel;
      } catch (error) {
        console.error('❌ Failed to create subscription:', error);
        
        // Retry on creation failure too
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          retryTimeoutRef.current = setTimeout(() => {
            createSubscription(true);
          }, Math.min(1000 * Math.pow(2, retryCountRef.current), 5000));
        }
      }
    }, baseDelay);
  }, [config, onUpdate, cleanup]);

  useEffect(() => {
    createSubscription();
    return cleanup;
  }, [createSubscription, ...dependencies]);

  return { cleanup };
}
