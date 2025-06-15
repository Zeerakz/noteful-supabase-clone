
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useWorkspaceMembers, WorkspaceMember, PendingInvitation } from '@/hooks/useWorkspaceMembers';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WorkspaceRole } from '@/types/db';
import { useAuth } from '@/contexts/AuthContext';
import { MemberInviteForm, InviteFormInputs } from './MemberInviteForm';
import { WorkspaceMembersList } from './WorkspaceMembersList';
import { PendingInvitationsList } from './PendingInvitationsList';

interface MembersManagementTabProps {
  workspaceId: string;
}

export function MembersManagementTab({ workspaceId }: MembersManagementTabProps) {
  const { members, invitations, loading, refresh, updateMemberRole, removeMember, cancelInvitation } = useWorkspaceMembers(workspaceId);
  const { inviteUserToWorkspace } = useWorkspaces();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<InviteFormInputs>();
  
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<PendingInvitation | null>(null);

  const currentUserMembership = members.find(m => m.user_id === user?.id);
  const userRole = currentUserMembership?.role;
  const canManageMembers = userRole === 'owner' || userRole === 'admin';

  const onSubmit: SubmitHandler<InviteFormInputs> = async (data) => {
    setIsSubmitting(true);
    const { error, data: responseData } = await inviteUserToWorkspace(workspaceId, data.email, data.role);
    if (error) {
      toast({ title: 'Error sending invitation', description: error, variant: 'destructive' });
    } else {
      if (responseData?.testing_fallback) {
        toast({
          variant: 'default',
          title: 'Invitation Created (Testing Mode)',
          description: 'Email could not be sent. Check browser console for the invite link.',
          duration: 10000,
        });
        console.info(
          `[TESTING] An invitation was created for ${data.email}. Because your Resend account has not been configured with a verified domain, the email could not be sent. You can use this link to test the invite flow:`,
          responseData.invite_url
        );
      } else {
        toast({ title: 'Invitation sent successfully' });
      }
      form.reset();
      refresh();
    }
    setIsSubmitting(false);
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        toast({ title: 'Invitation link copied!' });
      })
      .catch(err => {
        console.error('Failed to copy link', err);
        toast({ title: 'Error copying link', variant: 'destructive' });
      });
  };
  
  const handleRoleChange = async (member: WorkspaceMember, newRole: WorkspaceRole) => {
    if (member.role === newRole) return;
    const { error } = await updateMemberRole(member.id, newRole);
    if (error) {
      toast({ title: 'Error updating role', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Role updated successfully' });
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    const { error } = await removeMember(memberToRemove.id);
    if (error) {
      toast({ title: 'Error removing member', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Member removed' });
    }
    setMemberToRemove(null);
  };

  const confirmCancelInvitation = async () => {
    if (!invitationToCancel) return;
    const { error } = await cancelInvitation(invitationToCancel.id);
    if (error) {
      toast({ title: 'Error canceling invitation', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Invitation canceled' });
    }
    setInvitationToCancel(null);
  };

  return (
    <div className="space-y-8">
      {canManageMembers && (
        <MemberInviteForm
          form={form}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {loading && <div className="text-center p-4">Loading...</div>}

      {!loading && (
        <>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Workspace Members ({members.length})</h3>
            <WorkspaceMembersList
              members={members}
              canManageMembers={canManageMembers}
              onRoleChange={handleRoleChange}
              onRemoveMember={setMemberToRemove}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Pending Invitations ({invitations.length})</h3>
            <PendingInvitationsList
              invitations={invitations}
              canManageMembers={canManageMembers}
              onCopyInvite={handleCopyInviteLink}
              onCancelInvite={setInvitationToCancel}
            />
          </div>
        </>
      )}
      
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.profiles?.email || 'this member'} from the workspace?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!invitationToCancel} onOpenChange={(open) => !open && setInvitationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for {invitationToCancel?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
