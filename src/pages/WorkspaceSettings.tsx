
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { WorkspaceSettingsView } from '@/components/workspaces/WorkspaceSettingsView';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { useAuth } from '@/contexts/AuthContext';

export function WorkspaceSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const { members, loading: membersLoading } = useWorkspaceMembers(workspaceId);

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  const currentUserMembership = members.find(m => m.user_id === user?.id);
  const userRole = currentUserMembership?.role;

  if (!workspaceId) {
    return <Navigate to="/" replace />;
  }

  if (!['owner', 'admin'].includes(userRole || '')) {
    return (
       <AppLayoutWithSidebar>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
       </AppLayoutWithSidebar>
    );
  }

  return (
    <AppLayoutWithSidebar>
      <WorkspaceSettingsView workspaceId={workspaceId} />
    </AppLayoutWithSidebar>
  );
}
