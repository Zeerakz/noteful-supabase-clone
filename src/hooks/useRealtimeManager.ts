
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Block } from '@/types/block';

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
  isSubscribed: boolean;
}

// Simplified type guard to check if an object is a Block
function isValidBlock(obj: any): obj is Block {
  return obj && 
         typeof obj === 'object' && 
         typeof obj.id === 'string' && 
         typeof obj.type === 'string';
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
      if (subscription) {
        this.subscriptions.set(subscriptionKey, subscription);
      } else {
        console.warn(`Failed to create subscription for ${subscriptionKey}`);
        return () => {};
      }
    }
    
    if (subscription) {
      subscription.callbacks.add(callbacks);
    }
    
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

  private createSubscription(type: 'page' | 'workspace' | 'database', id: string): ActiveSubscription | null {
    try {
      const channelName = `realtime_${type}_${id}`;

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
          console.error(`Unknown subscription type: ${type}`);
          return null;
      }

      const channel = supabase.channel(channelName);
      
      if (!channel) {
        console.error('Failed to create Supabase channel');
        return null;
      }

      const subscription: ActiveSubscription = {
        id: channelName,
        type,
        filter,
        channel,
        callbacks: new Set(),
        isSubscribed: false,
      };

      // Set up the actual Supabase subscription
      channel
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter,
          },
          (payload) => {
            console.log(`📨 Realtime update for ${type}:${id}:`, payload);
            
            // Safely check for block types
            const newBlock = payload.new;
            const oldBlock = payload.old;
            
            // Broadcast to all callbacks
            subscription.callbacks.forEach(callback => {
              try {
                if (callback.onBlockChange) {
                  callback.onBlockChange(payload);
                }
                
                // Handle page-specific events
                const isNewBlockPage = newBlock && isValidBlock(newBlock) && newBlock.type === 'page';
                const isOldBlockPage = oldBlock && isValidBlock(oldBlock) && oldBlock.type === 'page';
                
                if ((isNewBlockPage || isOldBlockPage) && callback.onPageChange) {
                  callback.onPageChange(payload);
                }
              } catch (error) {
                console.error('Error in subscription callback:', error);
              }
            });

            // Emit global event for cross-component communication
            try {
              this.eventEmitter.dispatchEvent(new CustomEvent('realtimeUpdate', {
                detail: { type, id, payload }
              }));
            } catch (error) {
              console.error('Error dispatching global event:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Subscription status for ${type}:${id}:`, status);
          if (status === 'SUBSCRIBED') {
            subscription.isSubscribed = true;
          } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
            subscription.isSubscribed = false;
          }
        });

      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      return null;
    }
  }

  private cleanupSubscription(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      console.log('🧹 Cleaning up subscription:', key);
      try {
        if (subscription.channel && subscription.isSubscribed) {
          subscription.channel.unsubscribe();
        }
        if (subscription.channel) {
          supabase.removeChannel(subscription.channel);
        }
      } catch (error) {
        console.warn('Warning during subscription cleanup:', error);
      } finally {
        this.subscriptions.delete(key);
      }
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
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (user && !hasInitialized.current) {
      setIsConnected(true);
      hasInitialized.current = true;
    } else if (!user) {
      setIsConnected(false);
      realtimeManager.destroy();
      hasInitialized.current = false;
    }
  }, [user]);

  const subscribe = useCallback((
    type: 'page' | 'workspace' | 'database',
    id: string,
    callbacks: SubscriptionCallbacks
  ) => {
    if (!user || !id || !hasInitialized.current) return () => {};
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
