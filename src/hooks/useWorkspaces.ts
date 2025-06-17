
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvitationService } from '@/services/invitationService';
import type { InviteUserRequest } from '@/services/invitationService';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [trashedWorkspaces, setTrashedWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setTrashedWorkspaces([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch active workspaces (not deleted)
      const { data: activeData, error: activeError } = await supabase
        .from('workspace_members')
        .select('workspaces(*)')
        .eq('user_id', user.id)
        .is('workspaces.deleted_at', null);

      if (activeError) {
        throw activeError;
      }
      
      const userWorkspaces = activeData?.map(item => (item as any).workspaces).filter(Boolean) as Workspace[];
      setWorkspaces(userWorkspaces || []);

      // Fetch trashed workspaces (only those owned by the user)
      const { data: trashedData, error: trashedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_user_id', user.id)
        .not('deleted_at', 'is', null);

      if (trashedError) {
        throw trashedError;
      }

      setTrashedWorkspaces(trashedData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
      setWorkspaces([]);
      setTrashedWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string, description?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('workspaces')
        .insert([
          {
            name,
            description,
            owner_user_id: user.id,
          },
        ]);

      if (error) throw error;
      
      await fetchWorkspaces();
      
      return { data: null, error: null };
    } catch (err) {
      console.error("Full error from createWorkspace:", err);
      const error = err instanceof Error ? err.message : 'Failed to create workspace';
      return { data: null, error };
    }
  };

  const updateWorkspace = async (id: string, updates: Partial<Pick<Workspace, 'name' | 'description' | 'is_public'>>) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchWorkspaces();
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update workspace';
      return { data: null, error };
    }
  };

  const deleteWorkspace = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Soft delete the workspace
      const { error } = await supabase
        .from('workspaces')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_user_id', user.id); // Ensure only owner can delete

      if (error) throw error;
      
      await fetchWorkspaces();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete workspace';
      return { error };
    }
  };

  const restoreWorkspace = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Use the database function to restore workspace
      const { data, error } = await supabase.rpc('restore_workspace', {
        p_workspace_id: id,
        p_user_id: user.id
      });

      if (error) throw error;
      
      if (!data) {
        return { error: 'Failed to restore workspace. You may not have permission or the workspace was not found.' };
      }
      
      await fetchWorkspaces();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to restore workspace';
      return { error };
    }
  };

  const permanentlyDeleteWorkspace = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Permanently delete the workspace (hard delete from database)
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id)
        .eq('owner_user_id', user.id) // Ensure only owner can permanently delete
        .not('deleted_at', 'is', null); // Ensure it's already soft deleted

      if (error) throw error;
      
      await fetchWorkspaces();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to permanently delete workspace';
      return { error };
    }
  };

  const inviteUserToWorkspace = async (
    workspaceId: string,
    email: string,
    role: 'admin' | 'member' | 'guest'
  ) => {
    if (!user) return { error: 'User not authenticated' };

    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return { error: 'Workspace not found' };

    const request: InviteUserRequest = {
      email,
      workspaceId,
      role,
      workspaceName: workspace.name,
      inviterName: user.email || 'Someone'
    };

    const { error, success, data } = await InvitationService.inviteUser(request);
    return { error, success, data };
  };

  useEffect(() => {
    if (!authLoading) {
      fetchWorkspaces();
    }
  }, [user, authLoading]);

  return {
    workspaces,
    trashedWorkspaces,
    loading: loading || authLoading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    restoreWorkspace,
    permanentlyDeleteWorkspace,
    inviteUserToWorkspace,
  };
}
