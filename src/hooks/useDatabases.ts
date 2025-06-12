
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Database, DatabaseCreateRequest } from '@/types/database';
import { DatabaseService } from '@/services/databaseService';

export function useDatabases(workspaceId?: string) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDatabases = async () => {
    if (!user || !workspaceId) {
      setDatabases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await DatabaseService.fetchDatabases(workspaceId);

      if (error) throw new Error(error);
      setDatabases(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch databases');
      setDatabases([]);
    } finally {
      setLoading(false);
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

      // Immediately add the new database to the local state for instant UI update
      if (data) {
        setDatabases(prev => [data, ...prev]);
      }
      
      // Also fetch fresh data to ensure consistency
      await fetchDatabases();
      
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

      // Immediately remove the database from local state for instant UI update
      setDatabases(prev => prev.filter(db => db.id !== id));
      
      // Also fetch fresh data to ensure consistency
      await fetchDatabases();
      
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete database';
      return { error: errorMessage };
    }
  };

  useEffect(() => {
    fetchDatabases();
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
