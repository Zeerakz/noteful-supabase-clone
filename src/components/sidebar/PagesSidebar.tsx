
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { WorkspacePagesGroup } from './WorkspacePagesGroup';

export function PagesSidebar() {
  const { workspaces, loading } = useWorkspaces();

  console.log('PagesSidebar render:', { workspaces: workspaces?.length, loading });

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="px-4 py-3 border-b">
        <div className="font-semibold text-sm">Knowledge File</div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Loading workspaces...
          </div>
        ) : workspaces && workspaces.length > 0 ? (
          workspaces.map((workspace) => (
            <WorkspacePagesGroup
              key={workspace.id}
              workspaceId={workspace.id}
              workspaceName={workspace.name}
            />
          ))
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            No workspaces found. Please create a workspace first.
          </div>
        )}
      </SidebarContent>
      
      <SidebarFooter className="px-4 py-2 border-t text-xs text-muted-foreground">
        Sidebar Active
      </SidebarFooter>
    </Sidebar>
  );
}
