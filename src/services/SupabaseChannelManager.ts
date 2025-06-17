import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimeChannelSendResponse, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import {
  ChannelState,
  ChannelEvent,
  ChannelStateValue,
  createChannelStateMachine,
  channelStateReducer,
  calculateReconnectDelay,
  canReconnect,
  isConnectedState,
  isConnectingState,
  isErrorState
} from './ChannelStateMachine';

export interface ChannelInfo {
  channel: RealtimeChannel;
  key: string;
  stateMachine: ChannelStateValue;
  subscribeCount: number;
  createdAt: Date;
  lastActivity: Date;
  config: ChannelConfig;
}

export interface ChannelConfig {
  autoReconnect?: boolean;
  heartbeatInterval?: number;
  timeout?: number;
  rejoinUntilConnected?: boolean;
  maxReconnectAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export interface SubscriptionOptions {
  event: string;
  schema?: string;
  table?: string;
  filter?: string;
  callback: (payload: any) => void;
}

class SupabaseChannelManager {
  private channels = new Map<string, ChannelInfo>();
  private subscriptions = new Map<string, Set<SubscriptionOptions>>();
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>();
  
  private static instance: SupabaseChannelManager;
  
  static getInstance(): SupabaseChannelManager {
    if (!SupabaseChannelManager.instance) {
      SupabaseChannelManager.instance = new SupabaseChannelManager();
    }
    return SupabaseChannelManager.instance;
  }

  /**
   * Get or create a channel for the given key
   */
  getChannel(
    key: string,
    config: ChannelConfig = {}
  ): RealtimeChannel {
    const existingChannel = this.channels.get(key);
    
    if (existingChannel) {
      existingChannel.subscribeCount++;
      existingChannel.lastActivity = new Date();
      console.log(`📡 Reusing existing channel: ${key} (count: ${existingChannel.subscribeCount})`);
      return existingChannel.channel;
    }

    // Create new channel with proper options
    const channel = supabase.channel(key, {
      config: {
        presence: {
          key: key,
        },
        broadcast: {
          self: true,
        },
      },
    });

    const stateMachine = createChannelStateMachine({
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
    });

    const channelInfo: ChannelInfo = {
      channel,
      key,
      stateMachine,
      subscribeCount: 1,
      createdAt: new Date(),
      lastActivity: new Date(),
      config: {
        autoReconnect: true,
        heartbeatInterval: 30000,
        timeout: 10000,
        rejoinUntilConnected: true,
        ...config,
      },
    };

    // Set up state tracking
    this.setupChannelStateTracking(channelInfo);
    
    // Store channel info
    this.channels.set(key, channelInfo);
    this.subscriptions.set(key, new Set());

    console.log(`📡 Created new channel: ${key}`);
    return channel;
  }

  /**
   * Subscribe to postgres changes on a channel
   */
  subscribeToChanges(
    key: string,
    options: SubscriptionOptions,
    config: ChannelConfig = {}
  ): () => void {
    const channel = this.getChannel(key, config);
    const subscriptions = this.subscriptions.get(key)!;
    
    // Add subscription to tracking
    subscriptions.add(options);

    // Set up the postgres changes listener
    channel.on(
      'postgres_changes' as any,
      {
        event: options.event as any,
        schema: options.schema || 'public',
        table: options.table,
        filter: options.filter,
      },
      options.callback
    );

    // Subscribe to the channel if not already subscribed
    this.ensureChannelSubscribed(key);

    // Return unsubscribe function
    return () => {
      subscriptions.delete(options);
      this.decrementSubscribeCount(key);
    };
  }

  /**
   * Subscribe to presence events on a channel
   */
  subscribeToPresence(
    key: string,
    callbacks: {
      onSync?: (presences: any) => void;
      onJoin?: (presence: any) => void;
      onLeave?: (presence: any) => void;
    },
    config: ChannelConfig = {}
  ): () => void {
    const channel = this.getChannel(key, config);
    
    // Subscribe to presence events using the correct Supabase syntax
    if (callbacks.onSync) {
      channel.on('presence', { event: 'sync' }, () => {
        const presences = channel.presenceState();
        callbacks.onSync!(presences);
      });
    }
    
    if (callbacks.onJoin) {
      channel.on('presence', { event: 'join' }, ({ key: presenceKey, newPresences }) => {
        callbacks.onJoin!({ key: presenceKey, newPresences });
      });
    }
    
    if (callbacks.onLeave) {
      channel.on('presence', { event: 'leave' }, ({ key: presenceKey, leftPresences }) => {
        callbacks.onLeave!({ key: presenceKey, leftPresences });
      });
    }

    // Subscribe to the channel if not already subscribed
    this.ensureChannelSubscribed(key);

    // Return unsubscribe function
    return () => {
      this.decrementSubscribeCount(key);
    };
  }

  /**
   * Send presence data to a channel
   */
  async trackPresence(key: string, presence: any): Promise<RealtimeChannelSendResponse> {
    const channelInfo = this.channels.get(key);
    if (!channelInfo) {
      throw new Error(`Channel ${key} not found`);
    }

    return channelInfo.channel.track(presence);
  }

  /**
   * Remove a channel and clean up resources
   */
  removeChannel(key: string): boolean {
    const channelInfo = this.channels.get(key);
    if (!channelInfo) {
      console.warn(`📡 Channel ${key} not found for removal`);
      return false;
    }

    console.log(`📡 Removing channel: ${key}`);

    // Update state machine to closed
    this.updateChannelState(key, { type: 'CLOSE' });

    // Clear any pending reconnection
    const reconnectTimeout = this.reconnectTimeouts.get(key);
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      this.reconnectTimeouts.delete(key);
    }

    // Clear heartbeat interval
    const heartbeatInterval = this.heartbeatIntervals.get(key);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      this.heartbeatIntervals.delete(key);
    }

    // Unsubscribe and remove channel
    try {
      channelInfo.channel.unsubscribe();
      supabase.removeChannel(channelInfo.channel);
    } catch (error) {
      console.warn(`📡 Error removing channel ${key}:`, error);
    }

    // Clean up tracking
    this.channels.delete(key);
    this.subscriptions.delete(key);

    return true;
  }

  /**
   * Get the current state of a channel
   */
  getChannelState(key: string): ChannelState | null {
    const channelInfo = this.channels.get(key);
    return channelInfo ? channelInfo.stateMachine.state : null;
  }

  /**
   * Get channel information
   */
  getChannelInfo(key: string): ChannelInfo | null {
    return this.channels.get(key) || null;
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): Map<string, ChannelInfo> {
    return new Map(this.channels);
  }

  /**
   * Clean up unused channels (with no active subscriptions)
   */
  cleanup(): void {
    const channelsToRemove: string[] = [];

    this.channels.forEach((channelInfo, key) => {
      if (channelInfo.subscribeCount <= 0) {
        channelsToRemove.push(key);
      }
    });

    channelsToRemove.forEach(key => {
      console.log(`📡 Cleaning up unused channel: ${key}`);
      this.removeChannel(key);
    });
  }

  /**
   * Destroy all channels and clean up resources
   */
  destroyAll(): void {
    console.log('📡 Destroying all channels');
    
    const keys = Array.from(this.channels.keys());
    keys.forEach(key => this.removeChannel(key));
    
    this.channels.clear();
    this.subscriptions.clear();
    this.reconnectTimeouts.clear();
    this.heartbeatIntervals.clear();
  }

  private updateChannelState(key: string, event: ChannelEvent): void {
    const channelInfo = this.channels.get(key);
    if (!channelInfo) return;

    const previousState = channelInfo.stateMachine.state;
    channelInfo.stateMachine = channelStateReducer(channelInfo.stateMachine, event);
    const newState = channelInfo.stateMachine.state;

    if (previousState !== newState) {
      console.log(`📡 Channel ${key} state: ${previousState} → ${newState}`);
      
      // Handle state transitions
      switch (newState) {
        case 'reconnecting':
          this.scheduleReconnection(key);
          break;
        case 'connected':
          this.setupHeartbeat(key);
          break;
        case 'error':
          console.error(`📡 Channel ${key} error:`, channelInfo.stateMachine.context.lastError);
          break;
      }
    }
  }

  private setupChannelStateTracking(channelInfo: ChannelInfo): void {
    const { channel, key } = channelInfo;

    // Track channel state changes
    channel.subscribe((status) => {
      console.log(`📡 Channel ${key} status: ${status}`);
      
      channelInfo.lastActivity = new Date();

      // Map Supabase status to state machine events
      switch (status) {
        case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
          this.updateChannelState(key, { type: 'CONNECTION_SUCCESS' });
          break;
        case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
          this.updateChannelState(key, { type: 'CONNECTION_FAILED', error: 'Connection timed out' });
          break;
        case REALTIME_SUBSCRIBE_STATES.CLOSED:
          this.updateChannelState(key, { type: 'DISCONNECT' });
          break;
        case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
          this.updateChannelState(key, { type: 'ERROR', error: 'Channel error' });
          break;
        default:
          // Handle connecting state
          this.updateChannelState(key, { type: 'CONNECT' });
          break;
      }
    });
  }

  private ensureChannelSubscribed(key: string): void {
    const channelInfo = this.channels.get(key);
    if (!channelInfo) return;

    const state = channelInfo.stateMachine.state;
    if (state === 'idle' || state === 'closed') {
      console.log(`📡 Subscribing to channel: ${key}`);
      this.updateChannelState(key, { type: 'CONNECT' });
    }
  }

  private decrementSubscribeCount(key: string): void {
    const channelInfo = this.channels.get(key);
    if (!channelInfo) return;

    channelInfo.subscribeCount = Math.max(0, channelInfo.subscribeCount - 1);
    channelInfo.lastActivity = new Date();

    console.log(`📡 Decremented subscribe count for ${key}: ${channelInfo.subscribeCount}`);

    // Schedule cleanup if no more subscribers
    if (channelInfo.subscribeCount === 0) {
      setTimeout(() => {
        if (channelInfo.subscribeCount === 0) {
          this.removeChannel(key);
        }
      }, 5000); // Wait 5 seconds before cleaning up
    }
  }

  private scheduleReconnection(key: string): void {
    const channelInfo = this.channels.get(key);
    if (!channelInfo || !canReconnect(channelInfo.stateMachine.context)) return;

    // Clear any existing reconnection timeout
    const existingTimeout = this.reconnectTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const delay = calculateReconnectDelay(channelInfo.stateMachine.context);
    console.log(`📡 Scheduling reconnection for ${key} in ${delay}ms (attempt ${channelInfo.stateMachine.context.reconnectAttempts})`);

    const timeout = setTimeout(() => {
      console.log(`📡 Attempting to reconnect channel: ${key}`);
      
      const currentChannelInfo = this.channels.get(key);
      if (!currentChannelInfo || currentChannelInfo.subscribeCount === 0) {
        this.reconnectTimeouts.delete(key);
        return;
      }

      // Recreate the channel
      const newChannel = supabase.channel(key, {
        config: {
          presence: {
            key: key,
          },
          broadcast: {
            self: true,
          },
        },
      });
      
      currentChannelInfo.channel = newChannel;
      
      // Restore subscriptions
      const subscriptions = this.subscriptions.get(key);
      if (subscriptions) {
        subscriptions.forEach(sub => {
          newChannel.on(
            'postgres_changes' as any,
            {
              event: sub.event as any,
              schema: sub.schema || 'public',
              table: sub.table,
              filter: sub.filter,
            },
            sub.callback
          );
        });
      }

      // Re-setup state tracking
      this.setupChannelStateTracking(currentChannelInfo);
      
      this.reconnectTimeouts.delete(key);
    }, delay);

    this.reconnectTimeouts.set(key, timeout);
  }

  private setupHeartbeat(key: string): void {
    const channelInfo = this.channels.get(key);
    if (!channelInfo || !channelInfo.config.heartbeatInterval) return;

    // Clear existing heartbeat
    const existingInterval = this.heartbeatIntervals.get(key);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      if (isConnectedState(channelInfo.stateMachine.state)) {
        channelInfo.lastActivity = new Date();
        // Send a broadcast message instead of heartbeat event type
        channelInfo.channel.send({
          type: 'broadcast',
          event: 'ping',
          payload: { timestamp: Date.now() }
        });
      }
    }, channelInfo.config.heartbeatInterval);

    this.heartbeatIntervals.set(key, interval);
  }
}

// Export singleton instance
export const supabaseChannelManager = SupabaseChannelManager.getInstance();
export default SupabaseChannelManager;
