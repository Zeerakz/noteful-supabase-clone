
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseWorkspaceRealtimeProps {
  workspaceId?: string;
  onBlockChange?: (payload: any) => void;
  onPageChange?: (payload: any) => void;
}

interface BlockPayload {
  new?: {
    id: string;
    type: string;
    workspace_id: string;
    parent_id?: string;
    [key: string]: any;
  };
  old?: {
    id: string;
    type: string;
    workspace_id: string;
    parent_id?: string;
    [key: string]: any;
  };
  eventType: string;
}

export function useWorkspaceRealtime({ 
  workspaceId, 
  onBlockChange, 
  onPageChange 
}: UseWorkspaceRealtimeProps) {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const callbacksRef = useRef({ onBlockChange, onPageChange });

  // Keep callbacks current
  callbacksRef.current = { onBlockChange, onPageChange };

  const setupSubscription = useCallback(() => {
    if (!user || !workspaceId) {
      return;
    }

    // Clean up existing subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('🔗 Setting up workspace realtime subscription:', workspaceId);

    // Create new channel with unique name
    const channelName = `workspace_${workspaceId}_${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: BlockPayload) => {
          console.log('📨 Workspace realtime update:', payload);
          
          // Handle the payload more safely
          const newBlock = payload.new;
          const oldBlock = payload.old;
          const block = newBlock || oldBlock;
          
          if (block && typeof block === 'object' && 'type' in block) {
            if (block.type === 'page' && callbacksRef.current.onPageChange) {
              callbacksRef.current.onPageChange(payload);
            } else if (block.type !== 'page' && callbacksRef.current.onBlockChange) {
              callbacksRef.current.onBlockChange(payload);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Workspace subscription status:`, status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Workspace realtime connected successfully');
        } else if (status === 'TIMED_OUT') {
          console.log('⏰ Workspace subscription timed out, retrying...');
          // Retry after a delay
          setTimeout(() => {
            if (channelRef.current === channel) {
              setupSubscription();
            }
          }, 2000);
        }
      });

    channelRef.current = channel;
  }, [user, workspaceId]);

  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up workspace subscription');
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupSubscription]);

  return {
    isConnected: channelRef.current?.state === 'joined'
  };
}
