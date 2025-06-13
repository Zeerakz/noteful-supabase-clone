
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { WorkspacePagesGroup } from './WorkspacePagesGroup';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SearchTrigger } from './SearchTrigger';
import { NewPageAction } from './NewPageAction';
import { SystemActions } from './SystemActions';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

export function PagesSidebar() {
  const { workspaces } = useWorkspaces();
  const { isSearchOpen, closeSearch } = useGlobalSearch();

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-3 border-b">
          <WorkspaceSwitcher />
          <div className="mt-2">
            <SearchTrigger />
          </div>
        </SidebarHeader>
        
        <SidebarContent className="px-2">
          {workspaces.map((workspace) => (
            <WorkspacePagesGroup
              key={workspace.id}
              workspaceId={workspace.id}
              workspaceName={workspace.name}
            />
          ))}
        </SidebarContent>

        <SidebarFooter className="p-3 border-t space-y-2">
          <NewPageAction />
          
          <SidebarSeparator />
          
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-muted-foreground px-2 py-1">
              System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SystemActions />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
}
