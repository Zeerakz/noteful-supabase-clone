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
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspaces(*)')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
      
      const userWorkspaces = data?.map(item => (item as any).workspaces).filter(Boolean) as Workspace[];
      setWorkspaces(userWorkspaces || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string, description?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // To debug the RLS issue, we'll separate the insert from the select.
      // This helps determine if the INSERT is failing, or if the subsequent SELECT RLS check is the problem.
      const { error } = await supabase
        .from('workspaces')
        .insert([
          {
            name,
            description,
            owner_user_id: user.id,
          },
        ]);
        // Note: .select().single() has been removed for this test.

      if (error) throw error;
      
      // Manually refetch the workspaces list to get the new one.
      await fetchWorkspaces();
      
      // Since we are not selecting the data back, we return null for the data.
      // The calling component handles this gracefully.
      return { data: null, error: null };
    } catch (err) {
      // Adding more detailed logging to help debug.
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
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchWorkspaces();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete workspace';
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

    const { error, success } = await InvitationService.inviteUser(request);
    return { error, success };
  };

  useEffect(() => {
    if (!authLoading) {
      fetchWorkspaces();
    }
  }, [user, authLoading]);

  return {
    workspaces,
    loading: loading || authLoading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteUserToWorkspace,
  };
}
