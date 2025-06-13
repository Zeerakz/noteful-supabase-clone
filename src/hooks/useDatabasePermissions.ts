
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DatabasePermissionLevel = 'view_only' | 'can_edit_content' | 'full_access';

interface DatabasePermissions {
  canEditContent: boolean;
  canModifySchema: boolean;
  canManageViews: boolean;
  canDeleteRows: boolean;
  canAddRows: boolean;
  permissionLevel: DatabasePermissionLevel;
}

export function useDatabasePermissions(workspaceId: string) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<DatabasePermissions>({
    canEditContent: false,
    canModifySchema: false,
    canManageViews: false,
    canDeleteRows: false,
    canAddRows: false,
    permissionLevel: 'view_only'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !workspaceId) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is workspace owner
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('owner_user_id')
          .eq('id', workspaceId)
          .single();

        if (workspace?.owner_user_id === user.id) {
          setPermissions({
            canEditContent: true,
            canModifySchema: true,
            canManageViews: true,
            canDeleteRows: true,
            canAddRows: true,
            permissionLevel: 'full_access'
          });
          setLoading(false);
          return;
        }

        // Check workspace membership and role
        const { data: membership } = await supabase
          .from('workspace_membership')
          .select(`
            role_id,
            roles (role_name)
          `)
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .single();

        if (!membership) {
          // No access
          setPermissions({
            canEditContent: false,
            canModifySchema: false,
            canManageViews: false,
            canDeleteRows: false,
            canAddRows: false,
            permissionLevel: 'view_only'
          });
          setLoading(false);
          return;
        }

        const roleName = (membership as any).roles?.role_name;

        if (roleName === 'admin') {
          setPermissions({
            canEditContent: true,
            canModifySchema: true,
            canManageViews: true,
            canDeleteRows: true,
            canAddRows: true,
            permissionLevel: 'full_access'
          });
        } else if (roleName === 'editor') {
          setPermissions({
            canEditContent: true,
            canModifySchema: false,
            canManageViews: false,
            canDeleteRows: true,
            canAddRows: true,
            permissionLevel: 'can_edit_content'
          });
        } else {
          // viewer or any other role
          setPermissions({
            canEditContent: false,
            canModifySchema: false,
            canManageViews: false,
            canDeleteRows: false,
            canAddRows: false,
            permissionLevel: 'view_only'
          });
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        // Default to no permissions on error
        setPermissions({
          canEditContent: false,
          canModifySchema: false,
          canManageViews: false,
          canDeleteRows: false,
          canAddRows: false,
          permissionLevel: 'view_only'
        });
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user?.id, workspaceId]);

  return { permissions, loading };
}
