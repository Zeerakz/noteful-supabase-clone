import { useState, useEffect, useCallback } from 'react';
import { InvitationService } from '@/services/invitationService';
import { WorkspaceMember, PendingInvitation } from '@/types/workspace';
import { WorkspaceRole } from '@/types/db';

export { type WorkspaceMember, type PendingInvitation } from '@/types/workspace';

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

  const updateMemberRole = async (memberId: string, role: WorkspaceRole) => {
    const { error } = await InvitationService.updateMemberRole(memberId, role);
    if (error) {
      return { error };
    }
    await fetchMembersAndInvites();
    return { error: null };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await InvitationService.removeMember(memberId);
    if (error) {
      return { error };
    }
    await fetchMembersAndInvites();
    return { error: null };
  };

  const cancelInvitation = async (invitationId: string) => {
    const { error } = await InvitationService.cancelInvitation(invitationId);
    if (error) {
      return { error };
    }
    await fetchMembersAndInvites();
    return { error: null };
  };

  return { members, invitations, loading, refresh: fetchMembersAndInvites, updateMemberRole, removeMember, cancelInvitation };
}
