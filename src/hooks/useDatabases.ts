
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
    if (!user || !workspaceId) return;

    try {
      setLoading(true);
      const { data, error } = await DatabaseService.fetchDatabases(workspaceId);

      if (error) throw new Error(error);
      setDatabases(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch databases');
    } finally {
      setLoading(false);
    }
  };

  const createDatabase = async (request: DatabaseCreateRequest) => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected' };

    const { data, error } = await DatabaseService.createDatabase(
      workspaceId, 
      user.id, 
      request
    );
    
    if (!error) {
      // Refresh databases list
      await fetchDatabases();
    }
    
    return { data, error };
  };

  const deleteDatabase = async (id: string) => {
    const { error } = await DatabaseService.deleteDatabase(id);
    
    if (!error) {
      // Refresh databases list
      await fetchDatabases();
    }
    
    return { error };
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
