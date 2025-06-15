
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Users, MoreHorizontal, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PageTreeItem } from './PageTreeItem';
import { Teamspace } from '@/types/teamspace';
import { Block } from '@/types/block';

interface TeamspaceListProps {
  teamspaces: Teamspace[];
  teamspacePages: Record<string, Block[]>;
  pages: Block[];
  workspaceId: string;
  onDeletePage: (pageId: string) => void;
  onEditTeamspace: (teamspace: Teamspace) => void;
}

export function TeamspaceList({
  teamspaces,
  teamspacePages,
  pages,
  workspaceId,
  onDeletePage,
  onEditTeamspace,
}: TeamspaceListProps) {
  return (
    <>
      {teamspaces.map(teamspace => (
        <Collapsible key={teamspace.id} defaultOpen>
          <div className="group flex items-center pr-1">
            <CollapsibleTrigger className="w-full text-sm font-medium flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted flex-1">
              <Users className="h-4 w-4" />
              <span className="flex-1 text-left truncate">
                {teamspace.icon && <span className="mr-1.5">{teamspace.icon}</span>}
                {teamspace.name}
              </span>
            </CollapsibleTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEditTeamspace(teamspace)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CollapsibleContent>
            <Droppable droppableId={`teamspace-${teamspace.id}`} type="page">
              {(provided) => (
                <ul role="group" className="pt-1" aria-label={`${teamspace.name} pages`}>
                  <SidebarMenu ref={provided.innerRef} {...provided.droppableProps}>
                    {(teamspacePages[teamspace.id] || []).map((page, index) => (
                      <PageTreeItem
                        key={page.id}
                        page={page}
                        pages={pages}
                        workspaceId={workspaceId}
                        onDelete={onDeletePage}
                        index={index}
                      />
                    ))}
                    {provided.placeholder}
                    {(teamspacePages[teamspace.id] || []).length === 0 && (
                      <SidebarMenuItem>
                        <div className="px-2 py-1 text-xs text-muted-foreground">No pages in this teamspace.</div>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </ul>
              )}
            </Droppable>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </>
  );
}
