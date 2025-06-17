
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChannelManager {
  channel: RealtimeChannel;
  subscribers: Set<string>;
}

interface SubscriptionConfig {
  onBlockChange?: (payload: any) => void;
  onPageChange?: (payload: any) => void;
  onPresenceChange?: (payload: any) => void;
}

class RealtimeManager {
  private channels = new Map<string, ChannelManager>();
  private blockSubscriptions = new Map<string, Set<(payload: any) => void>>();

  subscribeToBlock(blockId: string, callback: (payload: any) => void): () => void {
    const channelKey = `block-${blockId}`;
    
    // Add callback to block subscriptions
    if (!this.blockSubscriptions.has(blockId)) {
      this.blockSubscriptions.set(blockId, new Set());
    }
    this.blockSubscriptions.get(blockId)!.add(callback);

    // Check if channel already exists
    let channelManager = this.channels.get(channelKey);
    
    if (!channelManager) {
      // Create new channel
      const channel = supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `id=eq.${blockId}`,
          },
          (payload) => {
            // Notify all subscribers for this block
            const subscribers = this.blockSubscriptions.get(blockId);
            if (subscribers) {
              subscribers.forEach(callback => callback(payload));
            }
          }
        )
        .subscribe();

      channelManager = {
        channel,
        subscribers: new Set([blockId])
      };
      this.channels.set(channelKey, channelManager);
    } else {
      // Add to existing channel
      channelManager.subscribers.add(blockId);
    }

    // Return unsubscribe function
    return () => {
      const blockCallbacks = this.blockSubscriptions.get(blockId);
      if (blockCallbacks) {
        blockCallbacks.delete(callback);
        if (blockCallbacks.size === 0) {
          this.blockSubscriptions.delete(blockId);
        }
      }

      const manager = this.channels.get(channelKey);
      if (manager) {
        manager.subscribers.delete(blockId);
        if (manager.subscribers.size === 0) {
          manager.channel.unsubscribe();
          this.channels.delete(channelKey);
        }
      }
    };
  }

  subscribe(type: string, id: string, config: SubscriptionConfig): () => void {
    const channelKey = `${type}-${id}`;
    
    let channelManager = this.channels.get(channelKey);
    
    if (!channelManager) {
      const channel = supabase.channel(channelKey);
      
      // Set up different types of subscriptions based on type
      if (type === 'page' && config.onBlockChange) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `parent_id=eq.${id}`,
          },
          config.onBlockChange
        );
      }
      
      if (type === 'workspace' && config.onPageChange) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `workspace_id=eq.${id}`,
          },
          config.onPageChange
        );
      }
      
      if (type === 'page' && config.onPresenceChange) {
        // Set up presence tracking
        channel.on('presence', { event: 'sync' }, () => {
          const presences = channel.presenceState();
          config.onPresenceChange?.({ type: 'sync', ...presences });
        });
        
        channel.on('presence', { event: 'join' }, ({ newPresences }) => {
          config.onPresenceChange?.({ type: 'join', newPresences });
        });
        
        channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
          config.onPresenceChange?.({ type: 'leave', leftPresences });
        });
      }
      
      channel.subscribe();
      
      channelManager = {
        channel,
        subscribers: new Set([id])
      };
      this.channels.set(channelKey, channelManager);
    } else {
      channelManager.subscribers.add(id);
    }

    // Return unsubscribe function
    return () => {
      const manager = this.channels.get(channelKey);
      if (manager) {
        manager.subscribers.delete(id);
        if (manager.subscribers.size === 0) {
          manager.channel.unsubscribe();
          this.channels.delete(channelKey);
        }
      }
    };
  }

  cleanup() {
    // Cleanup all channels
    this.channels.forEach(({ channel }) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.blockSubscriptions.clear();
  }
}

const realtimeManager = new RealtimeManager();

export function useRealtimeManager() {
  const subscribeToBlock = useCallback((blockId: string, callback: (payload: any) => void) => {
    return realtimeManager.subscribeToBlock(blockId, callback);
  }, []);

  const subscribe = useCallback((type: string, id: string, config: SubscriptionConfig) => {
    return realtimeManager.subscribe(type, id, config);
  }, []);

  return { subscribeToBlock, subscribe };
}

export function cleanupRealtimeManager() {
  realtimeManager.cleanup();
}
