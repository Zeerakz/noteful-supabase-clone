
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useWorkspaceMembers, WorkspaceMember, PendingInvitation } from '@/hooks/useWorkspaceMembers';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Send, Trash2, Mail, Loader2, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InvitationService } from '@/services/invitationService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { members, invitations, loading, refresh } = useWorkspaceMembers(workspaceId);
  const { inviteUserToWorkspace } = useWorkspaces();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormInputs>();

  const onSubmit: SubmitHandler<InviteFormInputs> = async (data) => {
    setIsSubmitting(true);
    const { error } = await inviteUserToWorkspace(workspaceId, data.email, data.role);
    if (error) {
      toast({ title: 'Error sending invitation', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Invitation sent successfully' });
      reset();
      refresh();
    }
    setIsSubmitting(false);
  };
  
  const handleRemoveMember = async (member: WorkspaceMember) => {
    if (!confirm(`Are you sure you want to remove ${member.profiles?.email} from the workspace?`)) return;
    const { error } = await InvitationService.removeMember(member.id);
    if (error) {
      toast({ title: 'Error removing member', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Member removed' });
      refresh();
    }
  };

  const handleCancelInvitation = async (invitation: PendingInvitation) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${invitation.email}?`)) return;
    const { error } = await InvitationService.cancelInvitation(invitation.id);
    if (error) {
      toast({ title: 'Error canceling invitation', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Invitation canceled' });
      refresh();
    }
  };

  return (
    <div className="space-y-6">
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
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Invite
            </Button>
          </form>
        </CardContent>
      </Card>

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
                {member.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveMember(member)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    <AvatarFallback><Mail className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">{invite.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleCancelInvitation(invite)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Need to import Controller from react-hook-form
import { Controller } from 'react-hook-form';
