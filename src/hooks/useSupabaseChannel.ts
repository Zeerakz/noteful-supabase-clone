
import { useEffect, useRef, useCallback } from 'react';
import { supabaseChannelManager, ChannelConfig, SubscriptionOptions } from '@/services/SupabaseChannelManager';

interface UseSupabaseChannelOptions {
  key: string;
  config?: ChannelConfig;
  enabled?: boolean;
}

interface UseSupabaseChannelReturn {
  subscribeToChanges: (options: SubscriptionOptions) => () => void;
  subscribeToPresence: (callbacks: {
    onSync?: (presences: any) => void;
    onJoin?: (presence: any) => void;
    onLeave?: (presence: any) => void;
  }) => () => void;
  trackPresence: (presence: any) => Promise<any>;
  getChannelState: () => string | null;
  isConnected: boolean;
}

export function useSupabaseChannel({
  key,
  config = {},
  enabled = true
}: UseSupabaseChannelOptions): UseSupabaseChannelReturn {
  const unsubscribeFunctionsRef = useRef<(() => void)[]>([]);
  const isEnabledRef = useRef(enabled);

  // Update enabled ref
  isEnabledRef.current = enabled;

  const subscribeToChanges = useCallback((options: SubscriptionOptions) => {
    if (!isEnabledRef.current) {
      return () => {};
    }

    const unsubscribe = supabaseChannelManager.subscribeToChanges(key, options, config);
    unsubscribeFunctionsRef.current.push(unsubscribe);
    
    return () => {
      const index = unsubscribeFunctionsRef.current.indexOf(unsubscribe);
      if (index > -1) {
        unsubscribeFunctionsRef.current.splice(index, 1);
      }
      unsubscribe();
    };
  }, [key, config]);

  const subscribeToPresence = useCallback((callbacks: {
    onSync?: (presences: any) => void;
    onJoin?: (presence: any) => void;
    onLeave?: (presence: any) => void;
  }) => {
    if (!isEnabledRef.current) {
      return () => {};
    }

    const unsubscribe = supabaseChannelManager.subscribeToPresence(key, callbacks, config);
    unsubscribeFunctionsRef.current.push(unsubscribe);
    
    return () => {
      const index = unsubscribeFunctionsRef.current.indexOf(unsubscribe);
      if (index > -1) {
        unsubscribeFunctionsRef.current.splice(index, 1);
      }
      unsubscribe();
    };
  }, [key, config]);

  const trackPresence = useCallback(async (presence: any) => {
    if (!isEnabledRef.current) {
      throw new Error('Channel is disabled');
    }
    return supabaseChannelManager.trackPresence(key, presence);
  }, [key]);

  const getChannelState = useCallback(() => {
    return supabaseChannelManager.getChannelState(key);
  }, [key]);

  const isConnected = getChannelState() === 'JOINED';

  // Cleanup on unmount or when key changes
  useEffect(() => {
    return () => {
      // Unsubscribe from all subscriptions when component unmounts
      unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctionsRef.current = [];
    };
  }, [key]);

  return {
    subscribeToChanges,
    subscribeToPresence,
    trackPresence,
    getChannelState,
    isConnected,
  };
}
