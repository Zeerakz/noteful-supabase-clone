
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvitationService, InviteUserRequest } from '@/services/invitationService';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMembership {
  id: string;
  user_id: string;
  workspace_id: string;
  role_id: number;
  invited_at: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'declined';
  roles?: {
    role_name: string;
    description?: string;
  };
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const fetchWorkspaces = async () => {
    if (!user) {
      console.log('No user authenticated, clearing workspaces and stopping load');
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🏢 Fetching workspaces for user:', user.id);
      
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching workspaces:', error);
        throw error;
      }
      
      console.log('✅ Workspaces fetched successfully:', data?.length || 0);
      setWorkspaces(data || []);

      // Set current workspace based on URL param or default to first workspace
      if (data && data.length > 0) {
        const workspaceId = params.workspaceId;
        if (workspaceId) {
          const workspace = data.find(w => w.id === workspaceId);
          if (workspace) {
            setCurrentWorkspace(workspace);
          } else {
            // If workspace ID in URL doesn't exist, default to first workspace
            setCurrentWorkspace(data[0]);
          }
        } else {
          // No workspace ID in URL, default to first workspace
          setCurrentWorkspace(data[0]);
        }
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      console.error('💥 Failed to fetch workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
      setWorkspaces([]);
      setCurrentWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      // Navigate to the workspace if not already there
      if (params.workspaceId !== workspaceId) {
        navigate(`/workspace/${workspaceId}`);
      }
    }
  };

  const createWorkspace = async (name: string, description?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([
          {
            name,
            description,
            owner_user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh workspaces list
      await fetchWorkspaces();
      
      return { data, error: null };
    } catch (err) {
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
      
      // Refresh workspaces list
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
      
      // Refresh workspaces list
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
    roleName: 'admin' | 'editor' | 'viewer'
  ) => {
    if (!user) return { error: 'User not authenticated' };

    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return { error: 'Workspace not found' };

    const request: InviteUserRequest = {
      email,
      workspaceId,
      roleName,
      workspaceName: workspace.name,
      inviterName: user.email || 'Someone'
    };

    const { error, success } = await InvitationService.inviteUser(request);
    return { error, success };
  };

  useEffect(() => {
    // Only fetch workspaces when authentication is complete
    if (!authLoading) {
      fetchWorkspaces();
    }
  }, [user, authLoading]);

  // Update current workspace when URL params change
  useEffect(() => {
    if (workspaces.length > 0 && params.workspaceId) {
      const workspace = workspaces.find(w => w.id === params.workspaceId);
      if (workspace && (!currentWorkspace || currentWorkspace.id !== workspace.id)) {
        setCurrentWorkspace(workspace);
      }
    }
  }, [params.workspaceId, workspaces, currentWorkspace]);

  return {
    workspaces,
    currentWorkspace,
    loading: loading || authLoading, // Show loading while auth is loading OR workspaces are loading
    error,
    fetchWorkspaces,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteUserToWorkspace,
  };
}
