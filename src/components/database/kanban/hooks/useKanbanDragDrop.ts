
import { useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { toast } from '@/hooks/use-toast';
import { DatabaseField } from '@/types/database';
import { PageWithProperties, KanbanColumn } from '../types';

interface UseKanbanDragDropProps {
  fields: DatabaseField[];
  pages: PageWithProperties[];
  columns: KanbanColumn[];
  selectField: DatabaseField | null;
  databaseId: string;
  setColumns: (columns: KanbanColumn[]) => void;
  setPages: React.Dispatch<React.SetStateAction<PageWithProperties[]>>;
}

export function useKanbanDragDrop({
  fields,
  pages,
  columns,
  selectField,
  databaseId,
  setColumns,
  setPages
}: UseKanbanDragDropProps) {
  const { user } = useAuth();
  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !selectField || !user) return;

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const pageId = draggableId;
    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;
    const newStatus = destColumnId === 'no-status' ? '' : 
      columns.find(col => col.id === destColumnId)?.title || '';

    // Find the page being moved
    const movedPage = pages.find(page => page.pageId === pageId);
    if (!movedPage) return;

    // Optimistic update: Update local state immediately
    const updatedColumns = columns.map(column => {
      // Remove page from source column
      if (column.id === sourceColumnId) {
        return {
          ...column,
          pages: column.pages.filter(page => page.pageId !== pageId),
        };
      }
      
      // Add page to destination column at the correct position
      if (column.id === destColumnId) {
        const newPages = [...column.pages];
        const updatedMovedPage = {
          ...movedPage,
          properties: {
            ...movedPage.properties,
            [selectField.id]: newStatus,
          },
          pos: destination.index,
        };
        
        newPages.splice(destination.index, 0, updatedMovedPage);
        
        // Update positions for all pages in the new arrangement
        newPages.forEach((page, index) => {
          page.pos = index;
        });
        
        return {
          ...column,
          pages: newPages,
        };
      }

      return column;
    });

    // Update local state optimistically
    setColumns(updatedColumns);

    // Update the moved page's properties in local state
    setPages(prevPages => prevPages.map(page => 
      page.pageId === pageId 
        ? {
            ...page,
            properties: {
              ...page.properties,
              [selectField.id]: newStatus,
            },
            pos: destination.index,
          }
        : page
    ));

    // Use the optimistic mutation to update the property
    propertyUpdateMutation.mutate(
      {
        pageId,
        fieldId: selectField.id,
        value: newStatus
      },
      {
        onError: () => {
          // Revert optimistic update on error
          setColumns(columns);
          setPages(pages);
        }
      }
    );

    // Handle position updates for other pages in the column if needed
    const positionField = fields.find(f => f.name.toLowerCase() === 'position' || f.name.toLowerCase() === 'pos');
    if (positionField) {
      const destColumn = updatedColumns.find(col => col.id === destColumnId);
      if (destColumn) {
        // Update positions for all pages in destination column
        destColumn.pages.forEach((page, index) => {
          if (page.pageId !== pageId) { // Skip the moved page as it's already handled
            propertyUpdateMutation.mutate({
              pageId: page.pageId,
              fieldId: positionField.id,
              value: index.toString()
            });
          }
        });
      }
    }

    toast({
      title: "Success",
      description: "Card moved successfully",
    });

  }, [selectField, user, columns, pages, setColumns, setPages, propertyUpdateMutation, fields, databaseId]);

  return { handleDragEnd };
}
