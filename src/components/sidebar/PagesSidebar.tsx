
import React from 'react';
import {
  Sidebar,
  SidebarContent,
} from '@/components/ui/sidebar';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { WorkspacePagesGroup } from './WorkspacePagesGroup';

export function PagesSidebar() {
  const { workspaces } = useWorkspaces();

  return (
    <Sidebar className="border-r">
      <SidebarContent className="overflow-visible">
        {workspaces.map((workspace) => (
          <WorkspacePagesGroup
            key={workspace.id}
            workspaceId={workspace.id}
            workspaceName={workspace.name}
          />
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
