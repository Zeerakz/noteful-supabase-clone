
export type BlockPermissionLevel = 'view' | 'comment' | 'edit' | 'full_access' | 'none';

export interface BlockPermissions {
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  canManagePermissions: boolean;
  permissionLevel: BlockPermissionLevel;
}

export interface BlockPermissionGrant {
  id: string;
  block_id: string;
  permission_level: 'view' | 'comment' | 'edit' | 'full_access';
  grantee_type: 'user' | 'group';
  user_id: string | null;
  group_id: string | null;
  granted_by: string | null;
  grantee_name?: string;
  grantee_avatar_url?: string;
}
