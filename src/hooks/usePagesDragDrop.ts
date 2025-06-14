
import { useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { Page } from '@/hooks/usePages';
import { useToast } from '@/hooks/use-toast';
import { validateDragAndDrop } from '@/utils/navigationConstraints';

interface UsePagesDragDropProps {
  workspaceId: string;
  pages: Page[];
  updatePageHierarchy: (pageId: string, newParentId: string | null, newIndex: number) => Promise<{ error?: string }>;
}

export function usePagesDragDrop({ workspaceId, pages, updatePageHierarchy }: UsePagesDragDropProps) {
  const { toast } = useToast();

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    // Parse destination droppable ID to get parent info
    const isTopLevel = destination.droppableId === `workspace-${workspaceId}`;
    const newParentId = isTopLevel ? null : destination.droppableId.replace('sub-', '');
    
    // If dropped in the same position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Validate the drag and drop operation against depth constraints
    const validation = validateDragAndDrop(pages, draggableId, newParentId, destination.index);
    
    if (!validation.isValid) {
      toast({
        title: "Cannot move page",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const { error } = await updatePageHierarchy(
      draggableId,
      newParentId,
      destination.index
    );

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Page moved successfully!",
      });
    }
  }, [workspaceId, pages, updatePageHierarchy, toast]);

  return {
    handleDragEnd,
  };
}
