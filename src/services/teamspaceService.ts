import { supabase } from '@/integrations/supabase/client';
import { Teamspace, TeamspaceMember, TeamspaceAccessLevel, TeamspaceMemberRole, DiscoverableTeamspace } from '@/types/teamspace';

export const TeamspaceService = {
  async getTeamspaces(workspaceId: string): Promise<{ data: Teamspace[] | null, error: string | null }> {
    const { data, error } = await supabase
      .from('teamspaces')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: data as Teamspace[], error: null };
  },

  async updateTeamspace(
    teamspaceId: string,
    updates: Partial<Pick<Teamspace, 'name' | 'description' | 'icon'>>
  ): Promise<{ data: Teamspace | null, error: string | null }> {
    const { data, error } = await supabase
      .from('teamspaces')
      .update(updates)
      .eq('id', teamspaceId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Teamspace, error: null };
  },

  async getDiscoverableTeamspaces(workspaceId: string, userId: string): Promise<{ data: DiscoverableTeamspace[] | null, error: string | null }> {
    const { data, error } = await supabase.rpc('get_discoverable_teamspaces', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching discoverable teamspaces:', error);
      return { data: null, error: error.message };
    }
    // The type from rpc might be stale because the generated types haven't been updated
    // after the migration. We cast to `any` to bypass the type check, as the
    // runtime data will be correct.
    return { data: data as any, error: null };
  },

  async createTeamspace(
    name: string,
    workspaceId: string,
    userId: string,
    description?: string,
    accessLevel: TeamspaceAccessLevel = 'private',
  ): Promise<{ data: Teamspace | null, error: string | null }> {
    const { data, error } = await supabase
      .from('teamspaces')
      .insert({
          name,
          description,
          workspace_id: workspaceId,
          created_by: userId,
          access_level: accessLevel
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Teamspace, error: null };
  },

  async getTeamspaceMembers(teamspaceId: string): Promise<{ data: TeamspaceMember[] | null, error: string | null }> {
    const { data: membersData, error: membersError } = await supabase
      .from('teamspace_members')
      .select(`id, teamspace_id, user_id, role, created_at`)
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

    const combinedData: TeamspaceMember[] = membersData.map((member: any) => ({
      ...member,
      profiles: profilesMap.get(member.user_id) || null
    }));

    return { data: combinedData, error: null };
  },

  async addMemberToTeamspace(teamspaceId: string, userId: string, role: TeamspaceMemberRole = 'member'): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('teamspace_members')
        .insert({ teamspace_id: teamspaceId, user_id: userId, role });
    
    if (error) return { error: error.message };
    return { error: null };
  },
  
  async removeMemberFromTeamspace(memberId: string): Promise<{ error: string | null }> {
      const { error } = await supabase
        .from('teamspace_members')
        .delete()
        .eq('id', memberId);

      if (error) return { error: error.message };
      return { error: null };
  },
};
