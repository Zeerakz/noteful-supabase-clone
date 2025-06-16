
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionCallbacks {
  onBlockChange?: (payload: any) => void;
  onPageChange?: (payload: any) => void;
  onDatabaseChange?: (payload: any) => void;
}

interface ActiveSubscription {
  id: string;
  type: 'page' | 'workspace' | 'database';
  filter: string;
  channel: any;
  callbacks: Set<SubscriptionCallbacks>;
}

class RealtimeManager {
  private subscriptions = new Map<string, ActiveSubscription>();
  private eventEmitter = new EventTarget();

  subscribe(
    type: 'page' | 'workspace' | 'database',
    id: string,
    callbacks: SubscriptionCallbacks
  ): () => void {
    const subscriptionKey = `${type}:${id}`;
    
    let subscription = this.subscriptions.get(subscriptionKey);
    
    if (!subscription) {
      subscription = this.createSubscription(type, id);
      this.subscriptions.set(subscriptionKey, subscription);
    }
    
    subscription.callbacks.add(callbacks);
    
    // Return unsubscribe function
    return () => {
      if (subscription) {
        subscription.callbacks.delete(callbacks);
        
        // Clean up subscription if no more callbacks
        if (subscription.callbacks.size === 0) {
          this.cleanupSubscription(subscriptionKey);
        }
      }
    };
  }

  private createSubscription(type: 'page' | 'workspace' | 'database', id: string): ActiveSubscription {
    const channelName = `realtime_${type}_${id}_${Date.now()}`;
    const channel = supabase.channel(channelName);

    let filter: string;
    
    switch (type) {
      case 'page':
        filter = `parent_id=eq.${id}`;
        break;
      case 'workspace':
        filter = `workspace_id=eq.${id}`;
        break;
      case 'database':
        filter = `properties->>database_id=eq.${id}`;
        break;
      default:
        throw new Error(`Unknown subscription type: ${type}`);
    }

    const subscription: ActiveSubscription = {
      id: channelName,
      type,
      filter,
      channel,
      callbacks: new Set(),
    };

    // Set up the actual Supabase subscription
    channel.on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'blocks',
        filter,
      },
      (payload) => {
        console.log(`📨 Realtime update for ${type}:${id}:`, payload);
        
        // Broadcast to all callbacks
        subscription.callbacks.forEach(callback => {
          if (payload.eventType === 'INSERT' && callback.onBlockChange) {
            callback.onBlockChange(payload);
          } else if (payload.eventType === 'UPDATE' && callback.onBlockChange) {
            callback.onBlockChange(payload);
          } else if (payload.eventType === 'DELETE' && callback.onBlockChange) {
            callback.onBlockChange(payload);
          }
          
          // Handle page-specific events
          if (payload.new?.type === 'page' || payload.old?.type === 'page') {
            if (callback.onPageChange) {
              callback.onPageChange(payload);
            }
          }
        });

        // Emit global event for cross-component communication
        this.eventEmitter.dispatchEvent(new CustomEvent('realtimeUpdate', {
          detail: { type, id, payload }
        }));
      }
    );

    channel.subscribe((status) => {
      console.log(`📡 Subscription status for ${type}:${id}:`, status);
    });

    return subscription;
  }

  private cleanupSubscription(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      console.log('🧹 Cleaning up subscription:', key);
      subscription.channel.unsubscribe();
      supabase.removeChannel(subscription.channel);
      this.subscriptions.delete(key);
    }
  }

  // Global event listener for cross-component communication
  addEventListener(callback: (event: CustomEvent) => void) {
    this.eventEmitter.addEventListener('realtimeUpdate', callback as EventListener);
    return () => {
      this.eventEmitter.removeEventListener('realtimeUpdate', callback as EventListener);
    };
  }

  destroy() {
    this.subscriptions.forEach((_, key) => {
      this.cleanupSubscription(key);
    });
  }
}

// Singleton instance
const realtimeManager = new RealtimeManager();

export function useRealtimeManager() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
      realtimeManager.destroy();
    }
  }, [user]);

  const subscribe = useCallback((
    type: 'page' | 'workspace' | 'database',
    id: string,
    callbacks: SubscriptionCallbacks
  ) => {
    if (!user || !id) return () => {};
    return realtimeManager.subscribe(type, id, callbacks);
  }, [user]);

  const addGlobalListener = useCallback((callback: (event: CustomEvent) => void) => {
    return realtimeManager.addEventListener(callback);
  }, []);

  return {
    subscribe,
    addGlobalListener,
    isConnected,
  };
}
