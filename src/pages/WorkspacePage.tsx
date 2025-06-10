
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { WorkspaceView } from '@/components/workspaces/WorkspaceView';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, loading } = useWorkspaces();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const workspace = workspaces.find(w => w.id === workspaceId);

  if (!workspace) {
    return <Navigate to="/" replace />;
  }

  return <WorkspaceView workspace={workspace} />;
}
