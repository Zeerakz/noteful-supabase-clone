
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
import { cn } from '@/lib/utils';

interface PagesSidebarProps {
  onNavigationItemSelect?: () => void;
}

export function PagesSidebar({ onNavigationItemSelect }: PagesSidebarProps) {
  const { workspaces } = useWorkspaces();
  const { isSearchOpen, closeSearch } = useGlobalSearch();

  return (
    <>
      <Sidebar className={cn("sidebar-accessible", "sidebar-focus-ring")}>
        <nav aria-label="Main navigation">
          <SidebarHeader className="p-3 border-b sidebar-accessible">
            <div className="sidebar-focus-ring">
              <WorkspaceSwitcher onSelect={onNavigationItemSelect} />
            </div>
            <div className="mt-2">
              <SearchTrigger onSelect={onNavigationItemSelect} />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-2 sidebar-accessible">
            <ul role="tree" aria-label="Workspace navigation">
              {workspaces.map((workspace) => (
                <WorkspacePagesGroup
                  key={workspace.id}
                  workspaceId={workspace.id}
                  workspaceName={workspace.name}
                  onNavigationItemSelect={onNavigationItemSelect}
                />
              ))}
            </ul>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t space-y-2 sidebar-accessible">
            <div className="sidebar-focus-ring">
              <NewPageAction onSelect={onNavigationItemSelect} />
            </div>
            
            <SidebarSeparator className="bg-sidebar-border" />
            
            <SidebarGroup>
              <SidebarGroupLabel className="sidebar-group-label">
                System
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SystemActions onNavigationItemSelect={onNavigationItemSelect} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarFooter>
        </nav>
      </Sidebar>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
}
