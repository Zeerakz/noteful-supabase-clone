
import { supabase } from '@/integrations/supabase/client';
import { BlockPermissionGrant, GrantablePermissionLevel } from '@/types/permissions';

export const PermissionService = {
  async getBlockPermissions(blockId: string): Promise<{ data: BlockPermissionGrant[] | null, error: string | null }> {
    const { data: permissions, error } = await supabase
      .from('block_permissions')
      .select(`*`)
      .eq('block_id', blockId);

    if (error) {
      console.error("Error fetching block permissions:", error);
      return { data: null, error: error.message };
    }
    if (!permissions) return { data: [], error: null };

    const userIds = permissions.filter(p => p.grantee_type === 'user' && p.user_id).map(p => p.user_id!);
    const groupIds = permissions.filter(p => p.grantee_type === 'group' && p.group_id).map(p => p.group_id!);

    const [profilesRes, groupsRes] = await Promise.all([
        userIds.length > 0 ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds) : Promise.resolve({ data: [], error: null }),
        groupIds.length > 0 ? supabase.from('groups').select('id, name').in('id', groupIds) : Promise.resolve({ data: [], error: null })
    ]);
    
    if (profilesRes.error) return { data: null, error: profilesRes.error.message };
    if (groupsRes.error) return { data: null, error: groupsRes.error.message };

    const profilesMap = new Map<string, { full_name: string | null, avatar_url: string | null }>(
      (profilesRes.data || []).map(p => [p.id, p])
    );
    const groupsMap = new Map<string, { name: string }>(
      (groupsRes.data || []).map(g => [g.id, g])
    );

    const formattedData = permissions
      .filter((p): p is Omit<typeof p, 'permission_level'> & { permission_level: GrantablePermissionLevel } => p.permission_level !== 'none')
      .map(p => {
        let grantee_name: string | undefined;
        let grantee_avatar_url: string | undefined;

        if (p.grantee_type === 'user' && p.user_id) {
            const profile = profilesMap.get(p.user_id);
            grantee_name = profile?.full_name || 'Unknown User';
            grantee_avatar_url = profile?.avatar_url || undefined;
        } else if (p.grantee_type === 'group' && p.group_id) {
            const group = groupsMap.get(p.group_id);
            grantee_name = group?.name || 'Unknown Group';
        }

        return { ...p, grantee_name, grantee_avatar_url } as BlockPermissionGrant;
    });

    return { data: formattedData, error: null };
  },

  async addUserPermission(blockId: string, userId: string, permissionLevel: GrantablePermissionLevel, grantedBy: string): Promise<{ data: BlockPermissionGrant | null, error: string | null }> {
    const { data, error } = await supabase
      .from('block_permissions')
      .insert({
        block_id: blockId,
        user_id: userId,
        permission_level: permissionLevel,
        grantee_type: 'user',
        granted_by: grantedBy
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error adding user permission:", error);
      return { data: null, error: error.message };
    }
    return { data: data as BlockPermissionGrant, error: null };
  },

  async addGroupPermission(blockId: string, groupId: string, permissionLevel: GrantablePermissionLevel, grantedBy: string): Promise<{ data: BlockPermissionGrant | null, error: string | null }> {
    const { data, error } = await supabase
      .from('block_permissions')
      .insert({
        block_id: blockId,
        group_id: groupId,
        permission_level: permissionLevel,
        grantee_type: 'group',
        granted_by: grantedBy
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error adding group permission:", error);
      return { data: null, error: error.message };
    }
    return { data: data as BlockPermissionGrant, error: null };
  },

  async updatePermission(permissionId: string, permissionLevel: GrantablePermissionLevel): Promise<{ data: BlockPermissionGrant | null, error: string | null }> {
    const { data, error } = await supabase
      .from('block_permissions')
      .update({ permission_level: permissionLevel })
      .eq('id', permissionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating permission:", error);
      return { data: null, error: error.message };
    }
    return { data: data as BlockPermissionGrant, error: null };
  },

  async removePermission(permissionId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('block_permissions')
      .delete()
      .eq('id', permissionId);

    if (error) {
      console.error("Error removing permission:", error);
      return { error: error.message };
    }
    return { error: null };
  }
};
