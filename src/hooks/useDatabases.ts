
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Database, DatabaseCreateRequest } from '@/types/database';
import { DatabaseService } from '@/services/databaseService';
import { supabase } from '@/integrations/supabase/client';

export function useDatabases(workspaceId?: string) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const subscriptionActiveRef = useRef(false);

  const fetchDatabases = async () => {
    if (!user || !workspaceId) {
      if (mountedRef.current) {
        setDatabases([]);
        setLoading(false);
      }
      return;
    }

    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      const { data, error } = await DatabaseService.fetchDatabases(workspaceId);

      if (error) throw new Error(error);
      if (mountedRef.current) {
        setDatabases(data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch databases');
        setDatabases([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const createDatabase = async (request: DatabaseCreateRequest) => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected' };

    try {
      const { data, error } = await DatabaseService.createDatabase(
        workspaceId, 
        user.id, 
        request
      );
      
      if (error) {
        return { data: null, error };
      }
      
      // No optimistic update needed, realtime will handle it
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create database';
      return { data: null, error: errorMessage };
    }
  };

  const deleteDatabase = async (id: string) => {
    try {
      const { error } = await DatabaseService.deleteDatabase(id);
      
      if (error) {
        return { error };
      }

      // No optimistic update needed, realtime will handle it
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete database';
      return { error: errorMessage };
    }
  };

  const cleanup = () => {
    if (channelRef.current && subscriptionActiveRef.current) {
      try {
        console.log('Cleaning up databases channel subscription');
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error unsubscribing from databases channel:', error);
      }
      channelRef.current = null;
      subscriptionActiveRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (!user || !workspaceId) {
      cleanup();
      setDatabases([]);
      setLoading(false);
      return;
    }

    fetchDatabases();
    cleanup();

    const channelName = `databases_${workspaceId}_${user.id}_${Date.now()}`;
    console.log('Creating databases channel:', channelName);
    
    const channel = supabase.channel(channelName);
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'databases',
        },
        (payload) => {
          if (mountedRef.current) {
            const oldData = payload.old as Database;
            const newData = payload.new as Database;

            // If the update affects this workspace, refetch
            if (
              (newData && newData.workspace_id === workspaceId) ||
              (oldData && oldData.workspace_id === workspaceId)
            ) {
              fetchDatabases();
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Databases subscription status:', status);
        if (err) {
          console.error(`Databases subscription error for workspace ${workspaceId}:`, err);
        } else if (status === 'SUBSCRIBED') {
          subscriptionActiveRef.current = true;
        } else if (status === 'CLOSED') {
          subscriptionActiveRef.current = false;
        }
      });
    
    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [user, workspaceId]);

  return {
    databases,
    loading,
    error,
    fetchDatabases,
    createDatabase,
    deleteDatabase,
  };
}
