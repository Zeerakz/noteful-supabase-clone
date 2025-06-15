
import React from 'react';
import { WorkspaceMember } from '@/hooks/useWorkspaceMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { WorkspaceRole } from '@/types/db';

interface WorkspaceMembersListProps {
  members: WorkspaceMember[];
  canManageMembers: boolean;
  onRoleChange: (member: WorkspaceMember, newRole: WorkspaceRole) => void;
  onRemoveMember: (member: WorkspaceMember) => void;
}

const getInitials = (name?: string | null) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
};

export function WorkspaceMembersList({ members, canManageMembers, onRoleChange, onRemoveMember }: WorkspaceMembersListProps) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 px-2">No members yet.</p>;
  }

  return (
    <div className="border rounded-lg">
      {members.map((member, index) => (
        <div key={member.id} className={`flex items-center justify-between p-3 ${index < members.length - 1 ? 'border-b' : ''}`}>
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
                      <DropdownMenuItem disabled={member.role === 'admin'} onClick={() => onRoleChange(member, 'admin')}>Admin</DropdownMenuItem>
                      <DropdownMenuItem disabled={member.role === 'member'} onClick={() => onRoleChange(member, 'member')}>Member</DropdownMenuItem>
                      <DropdownMenuItem disabled={member.role === 'guest'} onClick={() => onRoleChange(member, 'guest')}>Guest</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => onRemoveMember(member)}>
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
  );
}
