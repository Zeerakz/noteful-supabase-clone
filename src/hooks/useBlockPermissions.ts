
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
        // 1. Get inherited permissions from the database function
        const { data: inheritedPerm, error: rpcError } = await supabase.rpc(
          'get_inherited_block_permission',
          { p_block_id: blockId, p_user_id: user.id }
        );

        if (rpcError) {
          throw new Error(`Failed to get inherited permissions: ${rpcError.message}`);
        }

        const blockPermissionLevel: BlockPermissionLevel = inheritedPerm || 'none';
        
        const potentialPermissions: BlockPermissionLevel[] = [blockPermissionLevel];

        // 2. Add workspace-level permissions as a potential source
        if (workspacePermissions.permissionLevel === 'full_access') {
          potentialPermissions.push('full_access');
        } else if (workspacePermissions.permissionLevel === 'can_edit_content') {
          potentialPermissions.push('edit');
        } else {
          // All workspace members should be able to at least view.
          potentialPermissions.push('view');
        }
        
        // 3. Determine the final highest permission level
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
