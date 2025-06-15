
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvitationService } from '@/services/invitationService';

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface PendingInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  token: string;
  invited_by: string | null;
  created_at: string;
}

export function useWorkspaceMembers(workspaceId?: string) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembersAndInvites = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        InvitationService.getWorkspaceMembers(workspaceId),
        InvitationService.getPendingInvitations(workspaceId),
      ]);

      if (membersRes.error) throw new Error(`Failed to fetch members: ${membersRes.error}`);
      if (invitesRes.error) throw new Error(`Failed to fetch invites: ${invitesRes.error}`);
      
      setMembers((membersRes.data as WorkspaceMember[]) || []);
      setInvitations((invitesRes.data as PendingInvitation[]) || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembersAndInvites();
  }, [fetchMembersAndInvites]);

  return { members, invitations, loading, refresh: fetchMembersAndInvites };
}
