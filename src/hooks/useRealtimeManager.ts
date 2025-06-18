
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  channel: RealtimeChannel;
  callbacks: Set<(payload: any) => void>;
}

class RealtimeManager {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private static instance: RealtimeManager;

  static getInstance() {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  subscribeToBlock(blockId: string, callback: (payload: any) => void) {
    const key = `block:${blockId}`;
    
    if (!this.subscriptions.has(key)) {
      const channel = supabase
        .channel(`block_${blockId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `id=eq.${blockId}`
          },
          (payload) => {
            const subscription = this.subscriptions.get(key);
            if (subscription) {
              subscription.callbacks.forEach(cb => {
                try {
                  cb(payload);
                } catch (error) {
                  console.error('Error in realtime callback:', error);
                }
              });
            }
          }
        )
        .subscribe();

      this.subscriptions.set(key, {
        channel,
        callbacks: new Set([callback])
      });
    } else {
      this.subscriptions.get(key)!.callbacks.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        subscription.callbacks.delete(callback);
        
        // If no more callbacks, cleanup the subscription
        if (subscription.callbacks.size === 0) {
          subscription.channel.unsubscribe();
          this.subscriptions.delete(key);
        }
      }
    };
  }

  subscribeToPage(pageId: string, callback: (payload: any) => void) {
    const key = `page:${pageId}`;
    
    if (!this.subscriptions.has(key)) {
      const channel = supabase
        .channel(`page_blocks_${pageId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `parent_id=eq.${pageId}`
          },
          (payload) => {
            const subscription = this.subscriptions.get(key);
            if (subscription) {
              subscription.callbacks.forEach(cb => {
                try {
                  cb(payload);
                } catch (error) {
                  console.error('Error in realtime callback:', error);
                }
              });
            }
          }
        )
        .subscribe();

      this.subscriptions.set(key, {
        channel,
        callbacks: new Set([callback])
      });
    } else {
      this.subscriptions.get(key)!.callbacks.add(callback);
    }

    return () => {
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        subscription.callbacks.delete(callback);
        
        if (subscription.callbacks.size === 0) {
          subscription.channel.unsubscribe();
          this.subscriptions.delete(key);
        }
      }
    };
  }

  cleanup() {
    this.subscriptions.forEach(subscription => {
      subscription.channel.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

export function useRealtimeManager() {
  const managerRef = useRef<RealtimeManager>();

  if (!managerRef.current) {
    managerRef.current = RealtimeManager.getInstance();
  }

  const subscribeToBlock = useCallback((blockId: string, callback: (payload: any) => void) => {
    return managerRef.current!.subscribeToBlock(blockId, callback);
  }, []);

  const subscribeToPage = useCallback((pageId: string, callback: (payload: any) => void) => {
    return managerRef.current!.subscribeToPage(pageId, callback);
  }, []);

  return {
    subscribeToBlock,
    subscribeToPage,
    subscribe: subscribeToPage, // Legacy compatibility
  };
}

export function cleanupRealtimeManager() {
  RealtimeManager.getInstance().cleanup();
}
