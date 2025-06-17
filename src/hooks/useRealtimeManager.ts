
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionCallbacks {
  onBlockChange?: (payload: any) => void;
  onPageChange?: (payload: any) => void;
  onPresenceChange?: (payload: any) => void;
}

interface ChannelManager {
  channel: RealtimeChannel;
  subscribers: Set<string>;
  callbacks: Map<string, SubscriptionCallbacks>;
}

class RealtimeManager {
  private channels = new Map<string, ChannelManager>();
  private isConnected = false;

  subscribe(type: 'page' | 'workspace', id: string, callbacks: SubscriptionCallbacks): string {
    const channelKey = `${type}-${id}`;
    const subscriberId = crypto.randomUUID();

    console.log(`📡 Subscribing to channel: ${channelKey} with subscriber: ${subscriberId}`);

    let channelManager = this.channels.get(channelKey);

    if (!channelManager) {
      // Create new channel
      const channel = supabase.channel(channelKey);
      
      channelManager = {
        channel,
        subscribers: new Set(),
        callbacks: new Map()
      };

      // Set up the channel subscriptions
      if (type === 'page') {
        channel.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `parent_id=eq.${id}`
        }, (payload) => {
          console.log('📥 Block change received:', payload);
          channelManager!.callbacks.forEach(cb => cb.onBlockChange?.(payload));
        });

        channel.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `id=eq.${id}`
        }, (payload) => {
          console.log('📥 Page change received:', payload);
          channelManager!.callbacks.forEach(cb => cb.onPageChange?.(payload));
        });

        channel.on('presence', { event: 'sync' }, () => {
          console.log('👥 Presence sync');
          const presenceState = channel.presenceState();
          channelManager!.callbacks.forEach(cb => cb.onPresenceChange?.(presenceState));
        });

        channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 User joined:', key, newPresences);
          channelManager!.callbacks.forEach(cb => cb.onPresenceChange?.({ type: 'join', key, newPresences }));
        });

        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 User left:', key, leftPresences);
          channelManager!.callbacks.forEach(cb => cb.onPresenceChange?.({ type: 'leave', key, leftPresences }));
        });
      }

      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log(`📡 Channel ${channelKey} status:`, status);
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
        } else if (status === 'CLOSED') {
          this.isConnected = false;
        }
      });

      this.channels.set(channelKey, channelManager);
    }

    // Add subscriber
    channelManager.subscribers.add(subscriberId);
    channelManager.callbacks.set(subscriberId, callbacks);

    console.log(`📊 Channel ${channelKey} now has ${channelManager.subscribers.size} subscribers`);

    return subscriberId;
  }

  unsubscribe(type: 'page' | 'workspace', id: string, subscriberId: string) {
    const channelKey = `${type}-${id}`;
    const channelManager = this.channels.get(channelKey);

    if (!channelManager) {
      console.warn(`⚠️ Attempted to unsubscribe from non-existent channel: ${channelKey}`);
      return;
    }

    console.log(`📡 Unsubscribing ${subscriberId} from channel: ${channelKey}`);

    // Remove subscriber
    channelManager.subscribers.delete(subscriberId);
    channelManager.callbacks.delete(subscriberId);

    console.log(`📊 Channel ${channelKey} now has ${channelManager.subscribers.size} subscribers`);

    // If no more subscribers, unsubscribe and remove channel
    if (channelManager.subscribers.size === 0) {
      console.log(`🗑️ Removing channel: ${channelKey} (no more subscribers)`);
      supabase.removeChannel(channelManager.channel);
      this.channels.delete(channelKey);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  cleanup() {
    console.log('🧹 Cleaning up all realtime channels');
    this.channels.forEach((channelManager, channelKey) => {
      console.log(`🗑️ Removing channel: ${channelKey}`);
      supabase.removeChannel(channelManager.channel);
    });
    this.channels.clear();
    this.isConnected = false;
  }
}

// Global singleton instance
const realtimeManager = new RealtimeManager();

export function useRealtimeManager() {
  const subscribersRef = useRef<Array<{ type: 'page' | 'workspace', id: string, subscriberId: string }>>([]);

  const subscribe = useCallback((type: 'page' | 'workspace', id: string, callbacks: SubscriptionCallbacks) => {
    const subscriberId = realtimeManager.subscribe(type, id, callbacks);
    subscribersRef.current.push({ type, id, subscriberId });
    
    return () => {
      realtimeManager.unsubscribe(type, id, subscriberId);
      subscribersRef.current = subscribersRef.current.filter(s => s.subscriberId !== subscriberId);
    };
  }, []);

  const getConnectionStatus = useCallback(() => {
    return realtimeManager.getConnectionStatus();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscribersRef.current.forEach(({ type, id, subscriberId }) => {
        realtimeManager.unsubscribe(type, id, subscriberId);
      });
      subscribersRef.current = [];
    };
  }, []);

  return {
    subscribe,
    getConnectionStatus
  };
}

// Export cleanup function for app-level cleanup
export function cleanupRealtimeManager() {
  realtimeManager.cleanup();
}
