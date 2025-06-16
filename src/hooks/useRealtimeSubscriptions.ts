
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

  const subscribe = useCallback((config: SubscriptionConfig, callback: (payload: any) => void) => {
    if (!user) {
      return () => {}; // Return empty cleanup function if no user
    }

    const subscriptionKey = `${config.table}_${config.filter || 'all'}_${config.event || '*'}`;
    
    let subscription = subscriptionsRef.current.get(subscriptionKey);
    
    if (!subscription) {
      // Create new subscription
      const channelName = `${subscriptionKey}_${Date.now()}`;
      const channel = supabase.channel(channelName);
      
      const subscriptionConfig: any = {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
      };
      
      if (config.filter) {
        subscriptionConfig.filter = config.filter;
      }
      
      channel.on('postgres_changes', subscriptionConfig, (payload) => {
        subscription?.callbacks.forEach(cb => cb(payload));
      });
      
      channel.subscribe();
      
      subscription = {
        id: subscriptionKey,
        channel,
        config,
        callbacks: new Set([callback]),
        isActive: true,
      };
      
      subscriptionsRef.current.set(subscriptionKey, subscription);
    } else {
      // Add callback to existing subscription
      subscription.callbacks.add(callback);
    }

    // Return cleanup function
    return () => {
      const sub = subscriptionsRef.current.get(subscriptionKey);
      if (sub) {
        sub.callbacks.delete(callback);
        if (sub.callbacks.size === 0) {
          sub.channel.unsubscribe();
          supabase.removeChannel(sub.channel);
          subscriptionsRef.current.delete(subscriptionKey);
        }
      }
    };
  }, [user]);

  const cleanup = useCallback(() => {
    subscriptionsRef.current.forEach(subscription => {
      subscription.channel.unsubscribe();
      supabase.removeChannel(subscription.channel);
    });
    subscriptionsRef.current.clear();
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    subscribe,
    cleanup
  };
}
