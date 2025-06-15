
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

      setLoading(true);
      try {
        const { data: member, error } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();

        if (error || !member) {
          // No access or error, default to least privilege
          setPermissions({
            canEditContent: false,
            canModifySchema: false,
            canManageViews: false,
            canDeleteRows: false,
            canAddRows: false,
            permissionLevel: 'view_only'
          });
          if(error && error.code !== 'PGRST116') { // PGRST116: no rows returned
              console.error('Error checking permissions:', error);
          }
          return;
        }

        const role = member.role;

        if (role === 'owner' || role === 'admin') {
          setPermissions({
            canEditContent: true,
            canModifySchema: true,
            canManageViews: true,
            canDeleteRows: true,
            canAddRows: true,
            permissionLevel: 'full_access'
          });
        } else if (role === 'member') {
          setPermissions({
            canEditContent: true,
            canModifySchema: false,
            canManageViews: false,
            canDeleteRows: true,
            canAddRows: true,
            permissionLevel: 'can_edit_content'
          });
        } else { // guest
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
