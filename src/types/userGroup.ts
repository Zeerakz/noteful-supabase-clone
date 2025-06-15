
export interface UserGroup {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
}

export interface UserGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}
