
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Group } from '@/types/groups';

export function useGroups(workspaceId?: string) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_memberships (
            count
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedGroups: Group[] = data.map(g => ({
        ...g,
        member_count: (g.group_memberships[0] as any)?.count || 0,
      }));
      setGroups(formattedGroups);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchGroups();
    }
  }, [workspaceId, fetchGroups]);

  const createGroup = async (name: string, description?: string) => {
    if (!workspaceId || !user) return { error: 'Missing workspace or user' };

    const { data, error } = await supabase
      .from('groups')
      .insert({
        workspace_id: workspaceId,
        name,
        description,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    await fetchGroups(); // Refresh list
    return { data, error: null };
  };
  
  return { groups, loading, error, createGroup, fetchGroups };
}
