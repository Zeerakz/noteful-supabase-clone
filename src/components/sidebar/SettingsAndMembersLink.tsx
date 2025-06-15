
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { useAuth } from '@/contexts/AuthContext';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function SettingsAndMembersLink() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const { members, loading } = useWorkspaceMembers(workspaceId);

  if (loading || !workspaceId) {
    return null;
  }

  const currentUserMembership = members.find(m => m.user_id === user?.id);
  const userRole = currentUserMembership?.role;

  if (!['owner', 'admin'].includes(userRole || '')) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to={`/workspace/${workspaceId}/settings`}>
            <Settings className="mr-2" />
            <span>Settings & Members</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Manage workspace settings and members</p>
      </TooltipContent>
    </Tooltip>
  );
}
