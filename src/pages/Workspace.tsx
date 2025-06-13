
import React from 'react';
import { useParams } from 'react-router-dom';
import { WorkspaceView } from '@/components/workspaces/WorkspaceView';

export function Workspace() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Workspace not found</div>
      </div>
    );
  }

  return <WorkspaceView />;
}

export default Workspace;
