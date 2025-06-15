
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Teamspace {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamspaceMember {
    id: string;
    teamspace_id: string;
    user_id: string;
    created_at: string;
    profiles: {
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
    } | null;
}

export function useTeamspaces(workspaceId: string) {
  const [teamspaces, setTeamspaces] = useState<Teamspace[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTeamspaces = useCallback(async () => {
    if (!workspaceId) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teamspaces')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTeamspaces(data || []);
    } catch (error) {
      console.error('Failed to fetch teamspaces', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchTeamspaces();
  }, [fetchTeamspaces]);

  const createTeamspace = async (name: string, description?: string) => {
    if (!user || !workspaceId) return { error: 'Not authenticated or no workspace' };
    const { data, error } = await supabase
      .from('teamspaces')
      .insert({ name, description, workspace_id: workspaceId, created_by: user.id })
      .select()
      .single();

    if (error) return { error: error.message };
    
    await fetchTeamspaces();
    return { data };
  };

  const getTeamspaceMembers = async (teamspaceId: string): Promise<{ data: TeamspaceMember[] | null, error: string | null }> => {
    const { data: membersData, error: membersError } = await supabase
      .from('teamspace_members')
      .select(`id, teamspace_id, user_id, created_at`)
      .eq('teamspace_id', teamspaceId);

    if (membersError) {
      console.error('Error fetching teamspace members:', membersError);
      return { data: null, error: membersError.message };
    }
    if (!membersData) return { data: [], error: null };

    const userIds = membersData.map(m => m.user_id);
    if (userIds.length === 0) {
      return { data: [], error: null };
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles for members:', profilesError);
      return { data: null, error: profilesError.message };
    }

    const profilesMap = new Map(profilesData.map(p => [p.id, {
      full_name: p.full_name,
      email: p.email,
      avatar_url: p.avatar_url,
    }]));

    const combinedData: TeamspaceMember[] = membersData.map(member => ({
      ...member,
      profiles: profilesMap.get(member.user_id) || null
    }));

    return { data: combinedData, error: null };
  };

  const addMemberToTeamspace = async (teamspaceId: string, userId: string) => {
    const { error } = await supabase
        .from('teamspace_members')
        .insert({ teamspace_id: teamspaceId, user_id: userId });
    
    if (error) return { error: error.message };
    return { error: null };
  };
  
  const removeMemberFromTeamspace = async (memberId: string) => {
      const { error } = await supabase
        .from('teamspace_members')
        .delete()
        .eq('id', memberId);

      if (error) return { error: error.message };
      return { error: null };
  };

  return { 
      teamspaces, 
      loading, 
      fetchTeamspaces, 
      createTeamspace,
      getTeamspaceMembers,
      addMemberToTeamspace,
      removeMemberFromTeamspace
    };
}
