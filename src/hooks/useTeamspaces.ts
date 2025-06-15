
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TeamspaceService } from '@/services/teamspaceService';
import { Teamspace, TeamspaceAccessLevel } from '@/types/teamspace';

export { type Teamspace, type TeamspaceMember, type TeamspaceAccessLevel, type TeamspaceMemberRole } from '@/types/teamspace';

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
      const { data, error } = await TeamspaceService.getTeamspaces(workspaceId);
      if (error) throw new Error(error);
      setTeamspaces(data || []);
    } catch (error) {
      console.error('Failed to fetch teamspaces', error);
      setTeamspaces([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchTeamspaces();
  }, [fetchTeamspaces]);

  const createTeamspace = async (name: string, description?: string, accessLevel?: TeamspaceAccessLevel) => {
    if (!user || !workspaceId) return { error: 'Not authenticated or no workspace' };
    const { data, error } = await TeamspaceService.createTeamspace(name, workspaceId, user.id, description, accessLevel);

    if (error) return { error };
    
    await fetchTeamspaces();
    return { data };
  };

  const updateTeamspace = async (teamspaceId: string, updates: Partial<Pick<Teamspace, 'name' | 'description' | 'icon'>>) => {
    const { data, error } = await TeamspaceService.updateTeamspace(teamspaceId, updates);
    if (error) return { error };
    
    await fetchTeamspaces();
    return { data };
  };

  const getTeamspaceMembers = TeamspaceService.getTeamspaceMembers;

  const addMemberToTeamspace = TeamspaceService.addMemberToTeamspace;
  
  const removeMemberFromTeamspace = TeamspaceService.removeMemberFromTeamspace;

  return { 
      teamspaces, 
      loading, 
      fetchTeamspaces, 
      createTeamspace,
      updateTeamspace,
      getTeamspaceMembers,
      addMemberToTeamspace,
      removeMemberFromTeamspace
    };
}
