
import { useRef, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionConfig {
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isRetrying: boolean;
  retryCount: number;
  lastError?: string;
}

export function useStableSubscription(
  config: SubscriptionConfig | null,
  onUpdate: (payload: any) => void,
  dependencies: any[] = []
) {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const configRef = useRef<string>('');
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const lastUpdateRef = useRef<number>(0);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isRetrying: false,
    retryCount: 0,
  });

  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }

    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('🧹 Cleaning up subscription:', configRef.current);
        
        // More robust cleanup - check each method exists before calling
        const channel = channelRef.current;
        
        if (typeof channel?.unsubscribe === 'function') {
          channel.unsubscribe();
        }
        
        // Give unsubscribe time to complete before removing channel
        setTimeout(() => {
          if (supabase?.removeChannel && typeof supabase.removeChannel === 'function') {
            try {
              supabase.removeChannel(channel);
            } catch (error) {
              console.warn('Non-critical error removing channel:', error);
            }
          }
        }, 100);
        
      } catch (error) {
        console.warn('Warning during subscription cleanup (non-critical):', error);
      } finally {
        channelRef.current = null;
        isSubscribedRef.current = false;
        if (mountedRef.current) {
          setConnectionStatus(prev => ({ ...prev, isConnected: false }));
        }
      }
    }
  }, []);

  const createSubscription = useCallback(async () => {
    if (!config || !mountedRef.current) return;

    const configString = JSON.stringify(config);
    
    // Don't recreate if config hasn't changed and we're already connected
    if (configRef.current === configString && channelRef.current && isSubscribedRef.current) {
      return;
    }

    // Cleanup existing subscription
    cleanup();
    configRef.current = configString;

    // Create more unique channel name with table prefix to avoid conflicts
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const channelName = `${config.table}_${timestamp}_${random}`;
    
    console.log('📡 Creating subscription:', channelName, 'for config:', config);

    try {
      if (!mountedRef.current) return;

      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: channelName
          }
        }
      });
      
      // Set up the subscription with better error handling
      const subscription = channel.on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter }),
        },
        (payload) => {
          if (!mountedRef.current) return;
          
          // Debounce rapid updates to prevent spam
          const now = Date.now();
          if (now - lastUpdateRef.current < 50) return;
          lastUpdateRef.current = now;
          
          // Safely access the event type from the payload
          const eventType = (payload as any)?.event || (payload as any)?.eventType || 'unknown';
          console.log('📨 Subscription update received:', eventType, 'for', config.table);
          
          // Create a normalized payload with eventType for backward compatibility
          // Handle both old and new payload structures
          const normalizedPayload = {
            ...payload,
            eventType: eventType
          };
          
          try {
            onUpdate(normalizedPayload);
          } catch (error) {
            console.error('Error in subscription update handler:', error);
          }
        }
      );

      subscription.subscribe((status) => {
        if (!mountedRef.current) return;
        
        console.log('📡 Subscription status:', status, 'for', channelName);
        
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          setConnectionStatus(prev => ({
            ...prev,
            isConnected: true,
            isRetrying: false,
            retryCount: 0,
            lastError: undefined,
          }));
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          isSubscribedRef.current = false;
          if (channelRef.current === channel) {
            channelRef.current = null;
          }
          
          setConnectionStatus(prev => ({ ...prev, isConnected: false }));
          
          // For timeouts, try to reconnect immediately (once)
          if (status === 'TIMED_OUT' && connectionStatus.retryCount === 0) {
            console.log('📡 Subscription timed out, attempting immediate reconnect');
            setConnectionStatus(prev => ({ ...prev, retryCount: 1, isRetrying: true }));
            
            setTimeout(() => {
              if (mountedRef.current) {
                createSubscription();
              }
            }, 1000);
          }
        } else if (status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          if (channelRef.current === channel) {
            channelRef.current = null;
          }
          
          const currentRetryCount = connectionStatus.retryCount + 1;
          const maxRetries = 3; // Reduce max retries to prevent excessive attempts
          
          setConnectionStatus(prev => ({
            ...prev,
            isConnected: false,
            isRetrying: currentRetryCount <= maxRetries,
            retryCount: currentRetryCount,
            lastError: 'Connection error',
          }));
          
          // Retry with exponential backoff if under retry limit
          if (currentRetryCount <= maxRetries && mountedRef.current) {
            const delay = Math.min(2000 * Math.pow(2, currentRetryCount - 1), 15000);
            console.log(`📡 Retrying subscription in ${delay}ms (attempt ${currentRetryCount}/${maxRetries})`);
            
            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                console.log('📡 Retrying subscription for:', config.table);
                createSubscription();
              }
            }, delay);
          } else {
            console.error('📡 Max retries reached for subscription:', config.table);
            setConnectionStatus(prev => ({ ...prev, isRetrying: false }));
          }
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      if (mountedRef.current) {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          isRetrying: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }
  }, [config, onUpdate, cleanup, connectionStatus.retryCount]);

  useEffect(() => {
    mountedRef.current = true;
    createSubscription();
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [createSubscription, ...dependencies]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { 
    cleanup, 
    connectionStatus,
    reconnect: () => {
      if (mountedRef.current) {
        setConnectionStatus(prev => ({ ...prev, retryCount: 0 }));
        createSubscription();
      }
    }
  };
}
