
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlockPermissions, BlockPermissionLevel } from '@/types/permissions';
import { useDatabasePermissions } from './useDatabasePermissions';

const permissionHierarchy: Record<BlockPermissionLevel, number> = {
  none: 0,
  view: 1,
  comment: 2,
  edit: 3,
  full_access: 4,
};

function getHighestPermission(levels: (BlockPermissionLevel | null | undefined)[]): BlockPermissionLevel {
  let highestLevel: BlockPermissionLevel = 'none';
  for (const level of levels) {
    if (level && permissionHierarchy[level] > permissionHierarchy[highestLevel]) {
      highestLevel = level;
    }
  }
  return highestLevel;
}

export function useBlockPermissions(blockId?: string, workspaceId?: string) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<BlockPermissions>({
    canView: false,
    canComment: false,
    canEdit: false,
    canManagePermissions: false,
    permissionLevel: 'none',
  });
  const [loading, setLoading] = useState(true);

  const { permissions: workspacePermissions, loading: workspacePermissionsLoading } = useDatabasePermissions(workspaceId!);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user || !blockId || !workspaceId) {
        setPermissions({
          canView: false,
          canComment: false,
          canEdit: false,
          canManagePermissions: false,
          permissionLevel: 'none',
        });
        setLoading(false);
        return;
      }
      
      if (workspacePermissionsLoading) {
        setLoading(true);
        return;
      }

      setLoading(true);
      try {
        const { data: block, error: blockError } = await supabase
          .from('blocks')
          .select('created_by')
          .eq('id', blockId)
          .single();

        if (blockError || !block) {
          throw new Error(blockError?.message || 'Block not found.');
        }

        let potentialPermissions: BlockPermissionLevel[] = [];

        // 1. Workspace-level permissions as a baseline
        if (workspacePermissions.permissionLevel === 'full_access') {
          potentialPermissions.push('full_access');
        } else if (workspacePermissions.permissionLevel === 'can_edit_content') {
          potentialPermissions.push('edit');
        } else {
          potentialPermissions.push('view');
        }

        // 2. Block creator has full access
        if (block.created_by === user.id) {
          potentialPermissions.push('full_access');
        }

        // 3. Get direct user & group permissions for this block
        const { data: blockPerms, error: blockPermsError } = await supabase
            .from('block_permissions')
            .select('permission_level, grantee_type, user_id, group_id')
            .eq('block_id', blockId);

        if (blockPermsError) throw blockPermsError;
        
        if (blockPerms && blockPerms.length > 0) {
          // 4. Check for direct user permission
          const directUserPerm = blockPerms.find(p => p.grantee_type === 'user' && p.user_id === user.id);
          if (directUserPerm) {
            potentialPermissions.push(directUserPerm.permission_level as BlockPermissionLevel);
          }

          // 5. Check for group permissions
          const groupPerms = blockPerms.filter(p => p.grantee_type === 'group');
          if (groupPerms.length > 0) {
              const groupIds = groupPerms.map(p => p.group_id);
              const { data: userGroups, error: userGroupsError } = await supabase
                  .from('group_memberships')
                  .select('group_id')
                  .eq('user_id', user.id)
                  .in('group_id', groupIds as string[]);
              
              if (userGroupsError) throw userGroupsError;

              if (userGroups) {
                  for (const userGroup of userGroups) {
                      const matchingPerm = groupPerms.find(p => p.group_id === userGroup.group_id);
                      if (matchingPerm) {
                          potentialPermissions.push(matchingPerm.permission_level as BlockPermissionLevel);
                      }
                  }
              }
          }
        }
        
        const finalPermission = getHighestPermission(potentialPermissions);

        const perms: BlockPermissions = {
            permissionLevel: finalPermission,
            canView: permissionHierarchy[finalPermission] >= permissionHierarchy.view,
            canComment: permissionHierarchy[finalPermission] >= permissionHierarchy.comment,
            canEdit: permissionHierarchy[finalPermission] >= permissionHierarchy.edit,
            canManagePermissions: finalPermission === 'full_access',
        };

        setPermissions(perms);

      } catch (error: any) {
        console.error("Error fetching block permissions:", error);
        setPermissions({
            canView: false,
            canComment: false,
            canEdit: false,
            canManagePermissions: false,
            permissionLevel: 'none',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [blockId, workspaceId, user, workspacePermissions, workspacePermissionsLoading]);

  return { permissions, loading };
}
