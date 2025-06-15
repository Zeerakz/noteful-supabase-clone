
import { useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimisticPropertyValueUpdate } from '@/hooks/useOptimisticPropertyValueUpdate';
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
  const propertyUpdateMutation = useOptimisticPropertyValueUpdate(databaseId);

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
    
    // Determine the new property value based on field type and destination column
    let newValue = '';
    if (destColumnId !== 'no-status') {
      const destColumn = columns.find(col => col.id === destColumnId);
      if (destColumn) {
        if (selectField.type === 'status') {
          // For status fields, use the column ID (which is the option ID)
          newValue = destColumn.id;
        } else {
          // For select fields, use the column title (which is the option name)
          newValue = destColumn.title;
        }
      }
    }

    // Find the page being moved
    const movedPage = pages.find(page => page.pageId === pageId);
    if (!movedPage) return;

    // Store original state for rollback
    const originalColumns = [...columns];
    const originalPages = [...pages];

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
            [selectField.id]: newValue,
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
              [selectField.id]: newValue,
            },
            pos: destination.index,
          }
        : page
    ));

    // Use the optimistic mutation to update the property
    propertyUpdateMutation.mutate(
      {
        pageId,
        propertyId: selectField.id,
        value: newValue
      },
      {
        onError: (error) => {
          console.error('Failed to update property:', error);
          // Revert optimistic update on error
          setColumns(originalColumns);
          setPages(originalPages);
          
          toast({
            title: "Error",
            description: "Failed to move card. Please try again.",
            variant: "destructive",
          });
        },
        onSuccess: () => {
          console.log('Card moved successfully');
          toast({
            title: "Success",
            description: "Card moved successfully",
          });
        }
      }
    );

  }, [selectField, user, columns, pages, setColumns, setPages, propertyUpdateMutation, fields, databaseId]);

  return { handleDragEnd };
}
