
import React from 'react';
import { Workspace } from '@/hooks/useWorkspaces';
import { WorkspaceCard } from './WorkspaceCard';

interface WorkspaceGridProps {
  workspaces: Workspace[];
  onDeleteWorkspace: (workspaceId: string, workspaceName: string) => void;
}

export function WorkspaceGrid({ workspaces, onDeleteWorkspace }: WorkspaceGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <WorkspaceCard
          key={workspace.id}
          workspace={workspace}
          onDelete={onDeleteWorkspace}
        />
      ))}
    </div>
  );
}
