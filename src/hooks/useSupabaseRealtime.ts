
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

export function useSupabaseRealtime({
  type,
  filter,
  callbacks,
  config = {},
  enabled = true
}: UseSupabaseRealtimeOptions): UseSupabaseRealtimeReturn {
  const { user } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [channelState, setChannelState] = useState<ChannelState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique channel key based on type and filter
  const channelKey = useCallback(() => {
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

  // Handle postgres changes events
  const handlePostgresChanges = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log(`📨 Realtime ${type} update:`, { eventType, newRecord, oldRecord });
    
    switch (eventType) {
      case 'INSERT':
        if (callbacks.onInsert) {
          callbacks.onInsert(payload);
        }
        break;
      case 'UPDATE':
        if (callbacks.onUpdate) {
          callbacks.onUpdate(payload);
        }
        break;
      case 'DELETE':
        if (callbacks.onDelete) {
          callbacks.onDelete(payload);
        }
        break;
    }
  }, [type, callbacks]);

  // Set up the subscription
  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    const key = channelKey();
    console.log(`🔌 Setting up ${type} realtime subscription:`, key);

    // Clean up existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    let unsubscribe: (() => void) | null = null;

    if (type === 'presence') {
      // Handle presence subscription
      unsubscribe = supabaseChannelManager.subscribeToPresence(
        key,
        {
          onSync: callbacks.onPresenceSync,
          onJoin: callbacks.onPresenceJoin,
          onLeave: callbacks.onPresenceLeave,
        },
        config
      );
    } else {
      // Handle postgres changes subscription for blocks/pages
      const filterString = buildFilterString();
      const table = type === 'blocks' ? 'blocks' : 'blocks'; // Both use blocks table
      
      unsubscribe = supabaseChannelManager.subscribeToChanges(
        key,
        {
          event: '*',
          schema: 'public',
          table,
          filter: filterString,
          callback: handlePostgresChanges,
        },
        config
      );
    }

    unsubscribeRef.current = unsubscribe;

    // Poll for channel state updates
    const stateInterval = setInterval(() => {
      const state = supabaseChannelManager.getChannelState(key);
      setChannelState(state);
      
      const channelInfo = supabaseChannelManager.getChannelInfo(key);
      if (channelInfo?.stateMachine.context.lastError) {
        setError(channelInfo.stateMachine.context.lastError);
      } else {
        setError(null);
      }
    }, 1000);

    return () => {
      clearInterval(stateInterval);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [
    enabled,
    user,
    type,
    channelKey,
    buildFilterString,
    handlePostgresChanges,
    callbacks.onPresenceSync,
    callbacks.onPresenceJoin,
    callbacks.onPresenceLeave,
    config
  ]);

  // Retry function to manually reconnect
  const retry = useCallback(() => {
    if (!enabled || !user) return;

    const key = channelKey();
    const channelInfo = supabaseChannelManager.getChannelInfo(key);
    
    if (channelInfo) {
      console.log(`🔄 Manually retrying connection for ${type}:`, key);
      
      // Remove the channel and recreate subscription
      supabaseChannelManager.removeChannel(key);
      
      // Clear current subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Reset error state
      setError(null);
      
      // Trigger re-subscription by updating a dependency
      // This will cause the useEffect to run again
      setTimeout(() => {
        // Force re-render to trigger useEffect
        setChannelState(null);
      }, 100);
    }
  }, [enabled, user, type, channelKey]);

  return {
    isConnected: channelState ? isConnectedState(channelState) : false,
    error,
    retry,
  };
}
