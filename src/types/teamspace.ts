
export type TeamspaceAccessLevel = 'public' | 'private';
export type TeamspaceMemberRole = 'admin' | 'member';

export interface Teamspace {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  access_level: TeamspaceAccessLevel;
}

export interface TeamspaceMember {
  id: string;
  teamspace_id: string;
  user_id: string;
  role: TeamspaceMemberRole;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}
