
import { useState, useEffect } from 'react';
import { InvitationService } from '@/services/invitationService';
import { WorkspaceRole } from '@/types/db';

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  created_at: string;
  expires_at: string;
  token: string;
}

export function useWorkspaceMembers(workspaceId?: string) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      const [membersResult, invitationsResult] = await Promise.all([
        InvitationService.getWorkspaceMembers(workspaceId),
        InvitationService.getPendingInvitations(workspaceId)
      ]);

      if (membersResult.error) {
        console.error('Error fetching members:', membersResult.error);
      } else {
        setMembers(membersResult.data || []);
      }

      if (invitationsResult.error) {
        console.error('Error fetching invitations:', invitationsResult.error);
      } else {
        setInvitations(invitationsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const refresh = () => {
    fetchData();
  };

  const updateMemberRole = async (memberId: string, role: WorkspaceRole) => {
    const result = await InvitationService.updateMemberRole(memberId, role);
    if (!result.error) {
      await fetchData(); // Refresh the data
    }
    return result;
  };

  const removeMember = async (memberId: string) => {
    const result = await InvitationService.removeMember(memberId);
    if (!result.error) {
      await fetchData(); // Refresh the data
    }
    return result;
  };

  const cancelInvitation = async (invitationId: string) => {
    const result = await InvitationService.cancelInvitation(invitationId);
    if (!result.error) {
      await fetchData(); // Refresh the data
    }
    return result;
  };

  return {
    members,
    invitations,
    loading,
    refresh,
    updateMemberRole,
    removeMember,
    cancelInvitation
  };
}
