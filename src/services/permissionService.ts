
import { supabase } from '@/integrations/supabase/client';
import { BlockPermissionGrant, GrantablePermissionLevel } from '@/types/permissions';

export const PermissionService = {
  async getBlockPermissions(blockId: string): Promise<{ data: BlockPermissionGrant[] | null, error: string | null }> {
    const { data, error } = await supabase.rpc('get_page_sharers', { p_block_id: blockId });

    if (error) {
      console.error("Error fetching block permissions:", error);
      return { data: null, error: error.message };
    }
    if (!data) return { data: [], error: null };

    const formattedData: BlockPermissionGrant[] = data
      .filter((p): p is Omit<typeof p, 'permission_level'> & { permission_level: GrantablePermissionLevel } => p.permission_level !== null)
      .map(p => ({
        id: p.permission_id!,
        block_id: blockId,
        permission_level: p.permission_level,
        grantee_type: p.grantee_type as 'user' | 'group',
        user_id: p.grantee_type === 'user' ? p.grantee_id : null,
        group_id: p.grantee_type === 'group' ? p.grantee_id : null,
        granted_by: null, // This info is not returned by the function
        grantee_name: p.grantee_name || (p.grantee_type === 'user' ? 'Unknown User' : 'Unknown Group'),
        grantee_avatar_url: p.grantee_avatar_url || undefined,
      }));

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
