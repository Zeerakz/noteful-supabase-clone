
export interface Group {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  member_count?: number;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
  added_by: string | null;
}

export interface GroupMember {
  id: string; // user id
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}
