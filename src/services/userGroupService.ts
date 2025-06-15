
import { supabase } from '@/integrations/supabase/client';
import { UserGroup, UserGroupMember } from '@/types/userGroup';

export const UserGroupService = {
  async getGroups(workspaceId: string): Promise<{ data: UserGroup[] | null, error: string | null }> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error fetching groups:', error);
      return { data: null, error: error.message };
    }
    return { data, error: null };
  },

  async createGroup(workspaceId: string, name: string, description: string | null, userId: string): Promise<{ data: UserGroup | null, error: string | null }> {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        workspace_id: workspaceId,
        name,
        description,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      return { data: null, error: error.message };
    }
    return { data, error: null };
  },

  async getGroupMembers(groupId: string): Promise<{ data: UserGroupMember[] | null, error: string | null }> {
    const { data: membersData, error: membersError } = await supabase
      .from('group_memberships')
      .select('id, group_id, user_id')
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return { data: null, error: membersError.message };
    }

    if (!membersData || membersData.length === 0) {
      return { data: [], error: null };
    }

    const userIds = membersData.map(m => m.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles for group members:', profilesError);
      return { data: null, error: profilesError.message };
    }

    const profilesMap = new Map(profilesData.map(p => [p.id, {
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
    }]));

    const combinedData: UserGroupMember[] = membersData.map((member: any) => ({
      ...member,
      profiles: profilesMap.get(member.user_id) || null
    }));

    return { data: combinedData, error: null };
  },

  async addMemberToGroup(groupId: string, userId: string, addedBy: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('group_memberships')
      .insert({
        group_id: groupId,
        user_id: userId,
        added_by: addedBy
      });

    if (error) {
      console.error('Error adding member to group:', error);
      return { error: error.message };
    }
    return { error: null };
  },

  async removeMemberFromGroup(membershipId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('group_memberships')
      .delete()
      .eq('id', membershipId);

    if (error) {
      console.error('Error removing member from group:', error);
      return { error: error.message };
    }
    return { error: null };
  }
};
