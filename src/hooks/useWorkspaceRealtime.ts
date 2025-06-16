import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseWorkspaceRealtimeProps {
  workspaceId?: string;
  onBlockChange?: (payload: any) => void;
  onPageChange?: (payload: any) => void;
}

// Global subscription manager to prevent duplicate subscriptions
class WorkspaceSubscriptionManager {
  private subscriptions = new Map<string, {
    channel: any;
    callbacks: Set<{
      onBlockChange?: (payload: any) => void;
      onPageChange?: (payload: any) => void;
    }>;
  }>();

  subscribe(workspaceId: string, callbacks: { onBlockChange?: (payload: any) => void; onPageChange?: (payload: any) => void; }) {
    let subscription = this.subscriptions.get(workspaceId);

    if (!subscription) {
      console.log('🔗 Creating new workspace subscription for:', workspaceId);
      
      const channelName = `workspace_${workspaceId}`;
      const channel = supabase.channel(channelName);

      channel
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload: any) => {
            console.log('📨 Workspace realtime update:', payload);
            
            const newBlock = payload.new;
            const oldBlock = payload.old;
            const block = newBlock || oldBlock;
            
            if (block && typeof block === 'object' && 'type' in block) {
              subscription?.callbacks.forEach(callback => {
                try {
                  if (block.type === 'page' && callback.onPageChange) {
                    callback.onPageChange(payload);
                  } else if (block.type !== 'page' && callback.onBlockChange) {
                    callback.onBlockChange(payload);
                  }
                } catch (error) {
                  console.error('Error in subscription callback:', error);
                }
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Workspace subscription status:`, status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Workspace realtime connected successfully');
          } else if (status === 'TIMED_OUT') {
            console.log('⏰ Workspace subscription timed out');
          }
        });

      subscription = {
        channel,
        callbacks: new Set(),
      };

      this.subscriptions.set(workspaceId, subscription);
    }

    subscription.callbacks.add(callbacks);

    // Return unsubscribe function
    return () => {
      const sub = this.subscriptions.get(workspaceId);
      if (sub) {
        sub.callbacks.delete(callbacks);
        
        // Clean up if no more callbacks
        if (sub.callbacks.size === 0) {
          console.log('🧹 Cleaning up workspace subscription for:', workspaceId);
          try {
            sub.channel.unsubscribe();
            supabase.removeChannel(sub.channel);
          } catch (error) {
            console.warn('Warning during cleanup:', error);
          }
          this.subscriptions.delete(workspaceId);
        }
      }
    };
  }

  cleanup() {
    this.subscriptions.forEach((subscription, workspaceId) => {
      console.log('🧹 Force cleaning subscription for:', workspaceId);
      try {
        subscription.channel.unsubscribe();
        supabase.removeChannel(subscription.channel);
      } catch (error) {
        console.warn('Warning during force cleanup:', error);
      }
    });
    this.subscriptions.clear();
  }
}

// Global instance
const subscriptionManager = new WorkspaceSubscriptionManager();

export function useWorkspaceRealtime({ 
  workspaceId, 
  onBlockChange, 
  onPageChange 
}: UseWorkspaceRealtimeProps) {
  const { user } = useAuth();
  const callbacksRef = useRef({ onBlockChange, onPageChange });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Keep callbacks current
  callbacksRef.current = { onBlockChange, onPageChange };

  useEffect(() => {
    if (!user || !workspaceId) {
      return;
    }

    // Clean up existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Create new subscription
    unsubscribeRef.current = subscriptionManager.subscribe(workspaceId, callbacksRef.current);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, workspaceId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    isConnected: !!user && !!workspaceId
  };
}
