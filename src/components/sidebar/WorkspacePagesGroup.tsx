
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, FolderLock, Database as DatabaseIcon } from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useTeamspaces } from '@/hooks/useTeamspaces';
import { useDatabases } from '@/hooks/useDatabases';
import { useToast } from '@/hooks/use-toast';
import { PageTreeItem } from './PageTreeItem';
import { validateDragAndDrop } from '@/utils/navigationConstraints';
import { Block } from '@/types/block';
import { Teamspace } from '@/types/teamspace';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Settings } from 'lucide-react';
import { TeamspaceSettingsModal } from '@/components/workspaces/TeamspaceSettingsModal';
import { DatabaseListItem } from './DatabaseListItem';

interface WorkspacePagesGroupProps {
  workspaceId: string;
  workspaceName: string;
}

export function WorkspacePagesGroup({ workspaceId, workspaceName }: WorkspacePagesGroupProps) {
  const { pages, updatePageHierarchy, deletePage, hasOptimisticChanges, loading: pagesLoading, fetchPages } = useEnhancedPages(workspaceId);
  const { teamspaces, loading: teamspacesLoading } = useTeamspaces(workspaceId);
  const { databases, loading: databasesLoading, deleteDatabase } = useDatabases(workspaceId);
  const { toast } = useToast();
  const [editingTeamspace, setEditingTeamspace] = useState<Teamspace | null>(null);

  const loading = pagesLoading || teamspacesLoading || databasesLoading;

  const privatePages = pages.filter(p => !p.teamspace_id && !p.parent_id);
  const teamspacePages = pages.reduce((acc, page) => {
    if (page.teamspace_id && !page.parent_id) {
      if (!acc[page.teamspace_id]) {
        acc[page.teamspace_id] = [];
      }
      acc[page.teamspace_id].push(page);
    }
    return acc;
  }, {} as Record<string, Block[]>);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    const draggedPage = pages.find(p => p.id === draggableId);
    if (!draggedPage) return;

    let newParentId: string | null = null;
    let newTeamspaceId: string | null = null;

    if (destination.droppableId.startsWith('sub-')) {
        newParentId = destination.droppableId.replace('sub-', '');
        const parentPage = pages.find(p => p.id === newParentId);
        newTeamspaceId = parentPage?.teamspace_id || null;
    } else if (destination.droppableId.startsWith('teamspace-')) {
        newParentId = null;
        newTeamspaceId = destination.droppableId.replace('teamspace-', '');
    } else if (destination.droppableId.startsWith('private-')) {
        newParentId = null;
        newTeamspaceId = null;
    }

    const validation = validateDragAndDrop(pages, draggableId, newParentId, destination.index);
    if (!validation.isValid) {
      toast({ title: "Cannot move page", description: validation.error, variant: "destructive" });
      return;
    }

    const teamspaceChanged = draggedPage.teamspace_id !== newTeamspaceId;
    
    const { error: hierarchyError } = await updatePageHierarchy(
      draggableId,
      newParentId,
      destination.index
    );

    if (hierarchyError) {
      toast({ title: "Error moving page", description: hierarchyError, variant: "destructive" });
      return;
    }

    if (teamspaceChanged) {
      const { error: rpcError } = await supabase.rpc('update_block_teamspace_recursive', {
        p_block_id: draggableId,
        p_teamspace_id: newTeamspaceId,
      });

      if (rpcError) {
        toast({ title: "Error updating teamspace", description: rpcError.message, variant: "destructive" });
        await fetchPages(); // Revert optimistic hierarchy update by refetching
        return;
      }
    }
    
    toast({ title: "Success", description: "Page moved successfully!" });

    if (teamspaceChanged) {
      await fetchPages();
    }
  };

  const handleDeletePage = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    if (!confirm(`Are you sure you want to delete "${(page.properties as any)?.title || 'Untitled'}"? This action cannot be undone.`)) {
      return;
    }

    await deletePage(pageId);
  };

  const handleDeleteDatabase = async (databaseId: string, databaseName: string) => {
    if (!confirm(`Are you sure you want to delete database "${databaseName}"? This will also delete all its contents and cannot be undone.`)) {
      return;
    }
    const { error } = await deleteDatabase(databaseId);
    if (error) {
      toast({ title: "Error deleting database", description: error, variant: "destructive" });
    } else {
      toast({ title: "Database deleted" });
    }
  };

  if (loading) {
    return (
      <li role="treeitem" aria-expanded="false">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="truncate flex items-center gap-2">
              {workspaceName}
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="text-muted-foreground">
                  Loading pages...
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </li>
    );
  }

  return (
    <li role="treeitem" aria-expanded="true">
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between">
          <span className="truncate flex items-center gap-2">
            {workspaceName}
            {hasOptimisticChanges && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Syncing changes..." />
            )}
          </span>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-1">
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
                        <DropdownMenuItem onClick={() => setEditingTeamspace(teamspace)}>
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
                                  onDelete={handleDeletePage}
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
                                onDelete={handleDeletePage}
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
            </div>
          </DragDropContext>
          
          <div className="space-y-1 mt-2 border-t pt-2">
            <Collapsible defaultOpen>
                <CollapsibleTrigger className="w-full text-sm font-medium flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted">
                  <DatabaseIcon className="h-4 w-4" />
                  <span className="flex-1 text-left truncate">Databases</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul role="group" className="pt-1" aria-label="Databases">
                      <SidebarMenu>
                          {databases.map((db) => (
                              <DatabaseListItem
                              key={db.id}
                              database={db}
                              onDelete={handleDeleteDatabase}
                              />
                          ))}
                          {databases.length === 0 && !databasesLoading && (
                              <SidebarMenuItem>
                              <div className="px-2 py-1 text-xs text-muted-foreground">No databases.</div>
                              </SidebarMenuItem>
                          )}
                          {databasesLoading && (
                             <SidebarMenuItem>
                              <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin"/> Loading...
                              </div>
                            </SidebarMenuItem>
                          )}
                      </SidebarMenu>
                  </ul>
                </CollapsibleContent>
            </Collapsible>
          </div>

        </SidebarGroupContent>
      </SidebarGroup>
      {editingTeamspace && (
        <TeamspaceSettingsModal
          teamspace={editingTeamspace}
          isOpen={!!editingTeamspace}
          onClose={() => setEditingTeamspace(null)}
        />
      )}
    </li>
  );
}
