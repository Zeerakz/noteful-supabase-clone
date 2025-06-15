
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlockPermissions, BlockPermissionLevel } from '@/types/permissions';

const permissionHierarchy: Record<BlockPermissionLevel, number> = {
  none: 0,
  view: 1,
  comment: 2,
  edit: 3,
  full_access: 4,
};

export function useBlockPermissions(blockId?: string) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<BlockPermissions>({
    canView: false,
    canComment: false,
    canEdit: false,
    canManagePermissions: false,
    permissionLevel: 'none',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user || !blockId) {
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

      setLoading(true);
      try {
        const { data: finalPermission, error: rpcError } = await supabase.rpc(
          'get_user_final_block_permission',
          { p_block_id: blockId, p_user_id: user.id }
        );

        if (rpcError) {
          throw new Error(`Failed to get final permissions: ${rpcError.message}`);
        }
        
        const finalPermissionLevel: BlockPermissionLevel = finalPermission || 'none';

        const perms: BlockPermissions = {
            permissionLevel: finalPermissionLevel,
            canView: permissionHierarchy[finalPermissionLevel] >= permissionHierarchy.view,
            canComment: permissionHierarchy[finalPermissionLevel] >= permissionHierarchy.comment,
            canEdit: permissionHierarchy[finalPermissionLevel] >= permissionHierarchy.edit,
            canManagePermissions: finalPermissionLevel === 'full_access',
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
  }, [blockId, user?.id]);

  return { permissions, loading };
}
