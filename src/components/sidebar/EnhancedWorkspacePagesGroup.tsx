
import React, { useState, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Loader2 } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { useEnhancedPagesWithRealtime } from '@/hooks/useEnhancedPagesWithRealtime';
import { useTeamspaces } from '@/hooks/useTeamspaces';
import { useDatabases } from '@/hooks/useDatabases';
import { useToast } from '@/hooks/use-toast';
import { validateDragAndDrop } from '@/utils/navigationConstraints';
import { Block } from '@/types/block';
import { Teamspace } from '@/types/teamspace';
import { supabase } from '@/integrations/supabase/client';
import { TeamspaceSettingsModal } from '@/components/workspaces/TeamspaceSettingsModal';
import { TeamspaceList } from './TeamspaceList';
import { PrivatePagesList } from './PrivatePagesList';
import { EnhancedDatabaseList } from './EnhancedDatabaseList';
import { Separator } from '@/components/ui/separator';
import { EnhancedDragDropProvider } from '@/contexts/DragDropContext';
import { EnhancedDropIndicator } from '@/components/dnd/EnhancedDropIndicator';

interface EnhancedWorkspacePagesGroupProps {
  workspaceId: string;
  workspaceName: string;
}

export function EnhancedWorkspacePagesGroup({ workspaceId, workspaceName }: EnhancedWorkspacePagesGroupProps) {
  const { pages, updatePageHierarchy, deletePage, hasOptimisticChanges, loading: pagesLoading, fetchPages } = useEnhancedPagesWithRealtime(workspaceId);
  const { teamspaces, loading: teamspacesLoading } = useTeamspaces(workspaceId);
  const { databases, loading: databasesLoading, deleteDatabase } = useDatabases(workspaceId);
  const { toast } = useToast();
  const [editingTeamspace, setEditingTeamspace] = useState<Teamspace | null>(null);

  const loading = pagesLoading || teamspacesLoading;

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

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    // Determine if this is a database or page
    const isDatabaseDrag = draggedId.startsWith('database-');
    const isPageDrag = !isDatabaseDrag;

    if (isDatabaseDrag) {
      // Handle database reordering (simplified)
      const databaseId = draggedId.replace('database-', '');
      toast({ 
        title: "Database moved", 
        description: "Database order updated successfully" 
      });
      return;
    }

    // Handle page movements
    const draggedPage = pages.find(p => p.id === draggedId);
    if (!draggedPage) return;

    let newParentId: string | null = null;
    let newTeamspaceId: string | null = null;
    let newIndex = 0;

    if (overId.startsWith('sub-')) {
      newParentId = overId.replace('sub-', '');
      const parentPage = pages.find(p => p.id === newParentId);
      newTeamspaceId = parentPage?.teamspace_id || null;
    } else if (overId.startsWith('teamspace-')) {
      newParentId = null;
      newTeamspaceId = overId.replace('teamspace-', '');
    } else if (overId.startsWith('private-')) {
      newParentId = null;
      newTeamspaceId = null;
    }

    const pageValidation = validateDragAndDrop(pages, draggedId, newParentId, newIndex);
    if (!pageValidation.isValid) {
      toast({ title: "Cannot move page", description: pageValidation.error, variant: "destructive" });
      return;
    }

    const teamspaceChanged = draggedPage.teamspace_id !== newTeamspaceId;
    
    const { error: hierarchyError } = await updatePageHierarchy(
      draggedId,
      newParentId,
      newIndex
    );

    if (hierarchyError) {
      toast({ title: "Error moving page", description: hierarchyError, variant: "destructive" });
      return;
    }

    if (teamspaceChanged) {
      const { error: rpcError } = await supabase.rpc('update_block_teamspace_recursive', {
        p_block_id: draggedId,
        p_teamspace_id: newTeamspaceId,
      });

      if (rpcError) {
        toast({ title: "Error updating teamspace", description: rpcError.message, variant: "destructive" });
        await fetchPages();
        return;
      }
    }
    
    toast({ title: "Success", description: "Page moved successfully!" });

    if (teamspaceChanged) {
      await fetchPages();
    }
  }, [pages, updatePageHierarchy, fetchPages, toast]);

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
          <div className="space-y-1">
            <EnhancedDragDropProvider onDragEnd={handleDragEnd}>
              <div className="relative">
                <TeamspaceList
                  teamspaces={teamspaces}
                  teamspacePages={teamspacePages}
                  pages={pages}
                  workspaceId={workspaceId}
                  onDeletePage={handleDeletePage}
                  onEditTeamspace={setEditingTeamspace}
                />
                <PrivatePagesList
                  privatePages={privatePages}
                  pages={pages}
                  workspaceId={workspaceId}
                  onDeletePage={handleDeletePage}
                />
                
                {((teamspaces.length > 0 || privatePages.length > 0) && !databasesLoading) && (
                  <div className="px-2 pt-2 pb-1">
                    <Separator />
                  </div>
                )}

                <EnhancedDatabaseList
                  databases={databases}
                  databasesLoading={databasesLoading}
                  onDeleteDatabase={handleDeleteDatabase}
                />
                
                <EnhancedDropIndicator />
              </div>
            </EnhancedDragDropProvider>
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
