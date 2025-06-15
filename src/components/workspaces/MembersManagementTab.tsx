
import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useWorkspaceMembers, WorkspaceMember, PendingInvitation } from '@/hooks/useWorkspaceMembers';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Trash2, Mail, Loader2, MoreHorizontal, Copy } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { WorkspaceRole } from '@/types/db';
import { useAuth } from '@/contexts/AuthContext';

interface MembersManagementTabProps {
  workspaceId: string;
}

interface InviteFormInputs {
  email: string;
  role: 'admin' | 'member' | 'guest';
}

const getInitials = (name?: string | null) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
};

export function MembersManagementTab({ workspaceId }: MembersManagementTabProps) {
  const { members, invitations, loading, refresh, updateMemberRole, removeMember, cancelInvitation } = useWorkspaceMembers(workspaceId);
  const { inviteUserToWorkspace } = useWorkspaces();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<InviteFormInputs>();
  
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
      reset();
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
    <div className="space-y-6">
      {canManageMembers && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
              <div className="flex-grow">
                <Input
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } })}
                  placeholder="email@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <Controller
                name="role"
                control={control}
                defaultValue="member"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                Invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <div className="text-center p-4">Loading members...</div>}

      {!loading && (
        <>
          <div className="space-y-2">
            <h4 className="font-medium">Workspace Members ({members.length})</h4>
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.profiles?.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(member.profiles?.full_name || member.profiles?.email)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.profiles?.full_name || member.profiles?.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </div>
                {canManageMembers && member.role !== 'owner' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span>Change role</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem disabled={member.role === 'admin'} onClick={() => handleRoleChange(member, 'admin')}>Admin</DropdownMenuItem>
                            <DropdownMenuItem disabled={member.role === 'member'} onClick={() => handleRoleChange(member, 'member')}>Member</DropdownMenuItem>
                            <DropdownMenuItem disabled={member.role === 'guest'} onClick={() => handleRoleChange(member, 'guest')}>Guest</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => setMemberToRemove(member)}>
                        <Trash2 className="mr-2" /> Remove from workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-sm text-muted-foreground pr-4 capitalize">{member.role}</span>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Pending Invitations ({invitations.length})</h4>
            {invitations.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback><Mail /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">{invite.role}</p>
                  </div>
                </div>
                {canManageMembers && (
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleCopyInviteLink(invite.token)}
                      title="Copy invitation link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => setInvitationToCancel(invite)}
                      title="Cancel invitation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
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
