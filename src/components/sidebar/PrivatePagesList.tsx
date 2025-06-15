
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { FolderLock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { PageTreeItem } from './PageTreeItem';
import { Block } from '@/types/block';

interface PrivatePagesListProps {
  privatePages: Block[];
  pages: Block[];
  workspaceId: string;
  onDeletePage: (pageId: string) => void;
}

export function PrivatePagesList({
  privatePages,
  pages,
  workspaceId,
  onDeletePage,
}: PrivatePagesListProps) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full text-sm font-medium flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted">
        <FolderLock className="h-4 w-4" />
        <span className="flex-1 text-left truncate">Private</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Droppable droppableId={`private-${workspaceId}`} type="page">
          {(provided) => (
            <ul role="group" className="pt-1" aria-label="Private pages">
              <SidebarMenu ref={provided.innerRef} {...provided.droppableProps}>
                {privatePages.map((page, index) => (
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
                {privatePages.length === 0 && (
                  <SidebarMenuItem>
                    <div className="px-2 py-1 text-xs text-muted-foreground">No private pages.</div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </ul>
          )}
        </Droppable>
      </CollapsibleContent>
    </Collapsible>
  );
}
