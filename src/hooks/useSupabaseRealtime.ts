
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseChannelManager, ChannelConfig } from '@/services/SupabaseChannelManager';
import { ChannelState, isConnectedState, isErrorState } from '@/services/ChannelStateMachine';

interface RealtimeFilter {
  workspace_id?: string;
  parent_id?: string;
}

interface RealtimeCallbacks {
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onPresenceSync?: (presences: any) => void;
  onPresenceJoin?: (presence: any) => void;
  onPresenceLeave?: (presence: any) => void;
}

interface UseSupabaseRealtimeOptions {
  type: 'blocks' | 'pages' | 'presence';
  filter: RealtimeFilter;
  callbacks: RealtimeCallbacks;
  config?: ChannelConfig;
  enabled?: boolean;
}

interface UseSupabaseRealtimeReturn {
  isConnected: boolean;
  error: string | null;
  retry: () => void;
}

// Global subscription management for deduplication
interface SubscriptionState {
  unsubscribe: () => void;
  callbacks: Set<RealtimeCallbacks>;
  channelKey: string;
}

const globalSubscriptions = new Map<string, SubscriptionState>();

export function useSupabaseRealtime({
  type,
  filter,
  callbacks,
  config = {},
  enabled = true
}: UseSupabaseRealtimeOptions): UseSupabaseRealtimeReturn {
  const { user } = useAuth();
  const callbacksRef = useRef<RealtimeCallbacks>(callbacks);
  const subscriptionKeyRef = useRef<string | null>(null);
  const [channelState, setChannelState] = useState<ChannelState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update callbacks ref when callbacks change
  callbacksRef.current = callbacks;

  // Generate a stable subscription key based on type and filter
  const generateSubscriptionKey = useCallback(() => {
    const filterParts = [];
    if (filter.workspace_id) filterParts.push(`workspace:${filter.workspace_id}`);
    if (filter.parent_id) filterParts.push(`parent:${filter.parent_id}`);
    
    return `${type}_${filterParts.join('_')}`;
  }, [type, filter]);

  // Generate a unique channel key for the SupabaseChannelManager
  const generateChannelKey = useCallback(() => {
    const filterParts = [];
    if (filter.workspace_id) filterParts.push(`workspace:${filter.workspace_id}`);
    if (filter.parent_id) filterParts.push(`parent:${filter.parent_id}`);
    
    return `realtime_${type}_${filterParts.join('_')}`;
  }, [type, filter]);

  // Build filter string for postgres changes
  const buildFilterString = useCallback(() => {
    const filters = [];
    if (filter.workspace_id) {
      filters.push(`workspace_id=eq.${filter.workspace_id}`);
    }
    if (filter.parent_id) {
      filters.push(`parent_id=eq.${filter.parent_id}`);
    }
    return filters.join(',');
  }, [filter]);

  // Aggregated callback handlers that distribute to all registered callbacks
  const createAggregatedCallbacks = useCallback((subscriptionKey: string) => {
    const getActiveCallbacks = () => {
      const subscription = globalSubscriptions.get(subscriptionKey);
      return subscription ? Array.from(subscription.callbacks) : [];
    };

    return {
      handlePostgresChanges: (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        console.log(`📨 Realtime ${type} update:`, { eventType, newRecord, oldRecord });
        
        const activeCallbacks = getActiveCallbacks();
        
        switch (eventType) {
          case 'INSERT':
            activeCallbacks.forEach(cb => cb.onInsert?.(payload));
            break;
          case 'UPDATE':
            activeCallbacks.forEach(cb => cb.onUpdate?.(payload));
            break;
          case 'DELETE':
            activeCallbacks.forEach(cb => cb.onDelete?.(payload));
            break;
        }
      },
      handlePresenceSync: (presences: any) => {
        const activeCallbacks = getActiveCallbacks();
        activeCallbacks.forEach(cb => cb.onPresenceSync?.(presences));
      },
      handlePresenceJoin: (presence: any) => {
        const activeCallbacks = getActiveCallbacks();
        activeCallbacks.forEach(cb => cb.onPresenceJoin?.(presence));
      },
      handlePresenceLeave: (presence: any) => {
        const activeCallbacks = getActiveCallbacks();
        activeCallbacks.forEach(cb => cb.onPresenceLeave?.(presence));
      }
    };
  }, [type]);

  // Create or reuse subscription
  const setupSubscription = useCallback(() => {
    if (!enabled || !user) {
      return null;
    }

    const subscriptionKey = generateSubscriptionKey();
    const channelKey = generateChannelKey();
    
    console.log(`🔌 Setting up ${type} realtime subscription:`, subscriptionKey);

    // Check if subscription already exists
    let existingSubscription = globalSubscriptions.get(subscriptionKey);
    
    if (existingSubscription) {
      // Add callbacks to existing subscription
      existingSubscription.callbacks.add(callbacksRef.current);
      console.log(`♻️ Reusing existing subscription:`, subscriptionKey, `(${existingSubscription.callbacks.size} callbacks)`);
      
      return {
        subscriptionKey,
        channelKey: existingSubscription.channelKey,
        isNewSubscription: false
      };
    }

    // Create new subscription
    const aggregatedCallbacks = createAggregatedCallbacks(subscriptionKey);
    let unsubscribe: (() => void) | null = null;

    if (type === 'presence') {
      // Handle presence subscription
      unsubscribe = supabaseChannelManager.subscribeToPresence(
        channelKey,
        {
          onSync: aggregatedCallbacks.handlePresenceSync,
          onJoin: aggregatedCallbacks.handlePresenceJoin,
          onLeave: aggregatedCallbacks.handlePresenceLeave,
        },
        config
      );
    } else {
      // Handle postgres changes subscription for blocks/pages
      const filterString = buildFilterString();
      const table = type === 'blocks' ? 'blocks' : 'blocks'; // Both use blocks table
      
      unsubscribe = supabaseChannelManager.subscribeToChanges(
        channelKey,
        {
          event: '*',
          schema: 'public',
          table,
          filter: filterString,
          callback: aggregatedCallbacks.handlePostgresChanges,
        },
        config
      );
    }

    if (unsubscribe) {
      // Create new subscription state
      const subscriptionState: SubscriptionState = {
        unsubscribe,
        callbacks: new Set([callbacksRef.current]),
        channelKey
      };

      globalSubscriptions.set(subscriptionKey, subscriptionState);
      console.log(`✨ Created new subscription:`, subscriptionKey);
      
      return {
        subscriptionKey,
        channelKey,
        isNewSubscription: true
      };
    }

    return null;
  }, [enabled, user, generateSubscriptionKey, generateChannelKey, createAggregatedCallbacks, type, buildFilterString, config]);

  // Clean up subscription
  const cleanupSubscription = useCallback((subscriptionKey: string) => {
    const subscription = globalSubscriptions.get(subscriptionKey);
    if (!subscription) return;

    // Remove our callbacks from the subscription
    subscription.callbacks.delete(callbacksRef.current);
    
    console.log(`🧹 Removed callbacks from subscription:`, subscriptionKey, `(${subscription.callbacks.size} remaining)`);

    // If no more callbacks, clean up the subscription
    if (subscription.callbacks.size === 0) {
      console.log(`🗑️ Cleaning up empty subscription:`, subscriptionKey);
      subscription.unsubscribe();
      globalSubscriptions.delete(subscriptionKey);
    }
  }, []);

  // Set up the subscription
  useEffect(() => {
    const subscriptionInfo = setupSubscription();
    
    if (subscriptionInfo) {
      subscriptionKeyRef.current = subscriptionInfo.subscriptionKey;
      
      // Poll for channel state updates
      const stateInterval = setInterval(() => {
        const state = supabaseChannelManager.getChannelState(subscriptionInfo.channelKey);
        setChannelState(state);
        
        const channelInfo = supabaseChannelManager.getChannelInfo(subscriptionInfo.channelKey);
        if (channelInfo?.stateMachine.context.lastError) {
          setError(channelInfo.stateMachine.context.lastError);
        } else {
          setError(null);
        }
      }, 1000);

      return () => {
        clearInterval(stateInterval);
        if (subscriptionKeyRef.current) {
          cleanupSubscription(subscriptionKeyRef.current);
          subscriptionKeyRef.current = null;
        }
      };
    }

    return undefined;
  }, [setupSubscription, cleanupSubscription]);

  // Retry function to manually reconnect
  const retry = useCallback(() => {
    if (!enabled || !user || !subscriptionKeyRef.current) return;

    const subscription = globalSubscriptions.get(subscriptionKeyRef.current);
    if (!subscription) return;

    console.log(`🔄 Manually retrying connection for ${type}:`, subscriptionKeyRef.current);
    
    const channelInfo = supabaseChannelManager.getChannelInfo(subscription.channelKey);
    
    if (channelInfo) {
      // Remove the channel and let it reconnect
      supabaseChannelManager.removeChannel(subscription.channelKey);
      
      // Reset error state
      setError(null);
      
      // The subscription will be recreated on the next effect run
      setTimeout(() => {
        setChannelState(null);
      }, 100);
    }
  }, [enabled, user, type]);

  return {
    isConnected: channelState ? isConnectedState(channelState) : false,
    error,
    retry,
  };
}
