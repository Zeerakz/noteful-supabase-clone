
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Database, DatabaseCreateRequest } from '@/types/database';
import { DatabaseService } from '@/services/databaseService';
import { useStableSubscription } from '@/hooks/useStableSubscription';

export function useDatabases(workspaceId?: string) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const mountedRef = useRef(true);

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

  // Handle realtime updates
  const handleRealtimeUpdate = (payload: any) => {
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
  };

  // Set up realtime subscription
  const subscriptionConfig = {
    table: 'databases',
  };

  useStableSubscription(subscriptionConfig, handleRealtimeUpdate, [workspaceId]);

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

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete database';
      return { error: errorMessage };
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (!user || !workspaceId) {
      setDatabases([]);
      setLoading(false);
      return;
    }

    fetchDatabases();

    return () => {
      mountedRef.current = false;
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
