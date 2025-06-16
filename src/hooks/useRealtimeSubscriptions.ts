
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RealtimeSubscription {
  id: string;
  channel: any;
  config: SubscriptionConfig;
  callbacks: Set<(payload: any) => void>;
  isActive: boolean;
}

interface SubscriptionConfig {
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
}

export function useRealtimeSubscriptions() {
  const { user } = useAuth();
  const subscriptionsRef = useRef<Map<string, RealtimeSubscription>>(new Map());
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  const createSubscriptionKey = useCallback((config: SubscriptionConfig) => {
    return `${config.table}_${config.filter || 'all'}_${config.event || '*'}`;
  }, []);

  const createSubscription = useCallback((config: SubscriptionConfig) => {
    if (!user) return null;

    const key = createSubscriptionKey(config);
    const channelName = `${key}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    
    console.log('🔗 Creating subscription:', channelName);

    try {
      const channel = supabase.channel(channelName);
      
      if (!channel) {
        console.error('❌ Failed to create channel');
        return null;
      }

      const subscription: RealtimeSubscription = {
        id: channelName,
        channel,
        config,
        callbacks: new Set(),
        isActive: false,
      };

      // Set up postgres changes listener
      channel.on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter }),
        },
        (payload) => {
          console.log(`📨 Received update for ${config.table}:`, payload);
          
          // Broadcast to all callbacks for this subscription
          subscription.callbacks.forEach(callback => {
            try {
              callback({
                ...payload,
                eventType: payload.event || 'unknown'
              });
            } catch (error) {
              console.error('❌ Error in subscription callback:', error);
            }
          });
        }
      );

      // Subscribe with status monitoring
      channel.subscribe((status) => {
        console.log(`📡 Subscription ${channelName} status:`, status);
        subscription.isActive = status === 'SUBSCRIBED';
      });

      subscriptionsRef.current.set(key, subscription);
      return subscription;
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      return null;
    }
  }, [user, createSubscriptionKey]);

  const subscribe = useCallback((
    config: SubscriptionConfig,
    callback: (payload: any) => void
  ) => {
    if (!user) return () => {};

    const key = createSubscriptionKey(config);
    let subscription = subscriptionsRef.current.get(key);

    // Create new subscription if it doesn't exist
    if (!subscription) {
      subscription = createSubscription(config);
      if (!subscription) return () => {};
    }

    // Add callback to subscription
    subscription.callbacks.add(callback);
    console.log(`📝 Added callback to subscription ${key}, total callbacks:`, subscription.callbacks.size);

    // Return unsubscribe function
    return () => {
      if (subscription) {
        subscription.callbacks.delete(callback);
        console.log(`🗑️ Removed callback from subscription ${key}, remaining:`, subscription.callbacks.size);

        // Clean up subscription if no more callbacks
        if (subscription.callbacks.size === 0) {
          // Delay cleanup to allow for quick re-subscriptions
          if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
          }
          
          cleanupTimeoutRef.current = setTimeout(() => {
            const currentSub = subscriptionsRef.current.get(key);
            if (currentSub && currentSub.callbacks.size === 0) {
              console.log('🧹 Cleaning up unused subscription:', key);
              try {
                if (currentSub.channel && typeof currentSub.channel.unsubscribe === 'function') {
                  currentSub.channel.unsubscribe();
                }
                supabase.removeChannel(currentSub.channel);
              } catch (error) {
                console.warn('⚠️ Warning during subscription cleanup:', error);
              }
              subscriptionsRef.current.delete(key);
            }
          }, 1000); // 1 second delay for cleanup
        }
      }
    };
  }, [user, createSubscriptionKey, createSubscription]);

  // Cleanup all subscriptions on unmount or user change
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up all subscriptions');
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      subscriptionsRef.current.forEach((subscription, key) => {
        try {
          if (subscription.channel && typeof subscription.channel.unsubscribe === 'function') {
            subscription.channel.unsubscribe();
          }
          supabase.removeChannel(subscription.channel);
        } catch (error) {
          console.warn(`⚠️ Warning cleaning up subscription ${key}:`, error);
        }
      });
      
      subscriptionsRef.current.clear();
    };
  }, [user]);

  return { subscribe };
}
