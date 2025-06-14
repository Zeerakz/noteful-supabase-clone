
import React from 'react';
import { Home, Search, Plus, Settings, FileText } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RailSidebarProps {
  onNavigationItemSelect?: () => void;
  onExpand?: () => void;
}

export function RailSidebar({ onNavigationItemSelect, onExpand }: RailSidebarProps) {
  const { workspaces, currentWorkspace } = useWorkspaces();
  const { pages } = useEnhancedPages(currentWorkspace?.id || '');
  const navigate = useNavigate();

  // Use virtualization-friendly slice for performance
  const topLevelPages = pages.filter(page => !page.parent_page_id).slice(0, 4);

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigationItemSelect?.();
  };

  const handleNewPage = () => {
    if (currentWorkspace) {
      navigate(`/workspace/${currentWorkspace.id}/new-page`);
      onNavigationItemSelect?.();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar 
        className={cn(
          "w-16 border-r bg-sidebar transition-all duration-300",
          "hover:w-64 focus-within:w-64"
        )}
        onMouseEnter={onExpand}
        onFocus={onExpand}
      >
        <SidebarHeader className="p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                onClick={() => handleNavigation('/')}
                className="h-12 w-12 justify-center p-0"
              >
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Home</p>
            </TooltipContent>
          </Tooltip>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {/* Search */}
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton className="h-12 w-12 justify-center p-0">
                        <Search className="h-5 w-5" />
                        <span className="sr-only">Search</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Search</p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>

                {/* Recent Pages - Virtualization ready */}
                {topLevelPages.map((page) => (
                  <SidebarMenuItem key={page.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(`/workspace/${currentWorkspace?.id}/page/${page.id}`)}
                          className="h-12 w-12 justify-center p-0"
                        >
                          <FileText className="h-5 w-5" />
                          <span className="sr-only">{page.title}</span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{page.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2 space-y-1">
          {/* New Page */}
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                onClick={handleNewPage}
                className="h-12 w-12 justify-center p-0"
                disabled={!currentWorkspace}
              >
                <Plus className="h-5 w-5" />
                <span className="sr-only">New Page</span>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>New Page</p>
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton className="h-12 w-12 justify-center p-0">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
