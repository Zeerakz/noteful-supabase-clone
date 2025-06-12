
import { useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useAuth } from '@/contexts/AuthContext';
import { PagePropertyService } from '@/services/pagePropertyService';
import { toast } from '@/hooks/use-toast';
import { DatabaseField } from '@/types/database';
import { PageWithProperties, KanbanColumn } from '../types';

interface UseKanbanDragDropProps {
  fields: DatabaseField[];
  pages: PageWithProperties[];
  columns: KanbanColumn[];
  selectField: DatabaseField | null;
  setColumns: (columns: KanbanColumn[]) => void;
  setPages: React.Dispatch<React.SetStateAction<PageWithProperties[]>>;
}

export function useKanbanDragDrop({
  fields,
  pages,
  columns,
  selectField,
  setColumns,
  setPages
}: UseKanbanDragDropProps) {
  const { user } = useAuth();

  const updatePositionsInColumn = useCallback(async (columnPages: PageWithProperties[], columnValue: string) => {
    if (!user || !selectField) return;

    // Update positions for all pages in the column
    const updatePromises = columnPages.map(async (page, index) => {
      // Update position property if it exists
      const positionField = fields.find(f => f.name.toLowerCase() === 'position' || f.name.toLowerCase() === 'pos');
      if (positionField) {
        await PagePropertyService.upsertPageProperty(
          page.pageId,
          positionField.id,
          index.toString(),
          user.id
        );
      }
    });

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Failed to update positions:', error);
      toast({
        title: "Error",
        description: "Failed to update card positions",
        variant: "destructive",
      });
    }
  }, [user, selectField, fields]);

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

    try {
      // 1. First, update the group field value
      await PagePropertyService.upsertPageProperty(
        pageId,
        selectField.id,
        newStatus,
        user.id
      );

      // 2. Then reorder positions in the destination column
      const destColumn = updatedColumns.find(col => col.id === destColumnId);
      if (destColumn) {
        await updatePositionsInColumn(destColumn.pages, newStatus);
      }

      // 3. Also reorder positions in the source column if it's different
      if (sourceColumnId !== destColumnId) {
        const sourceColumn = updatedColumns.find(col => col.id === sourceColumnId);
        if (sourceColumn) {
          const sourceColumnValue = sourceColumnId === 'no-status' ? '' : 
            columns.find(col => col.id === sourceColumnId)?.title || '';
          await updatePositionsInColumn(sourceColumn.pages, sourceColumnValue);
        }
      }

      toast({
        title: "Success",
        description: "Card moved successfully",
      });

    } catch (error) {
      console.error('Failed to update card position:', error);
      
      // Revert optimistic update on error
      setColumns(columns);
      setPages(pages);
      
      toast({
        title: "Error",
        description: "Failed to move card. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectField, user, columns, pages, setColumns, setPages, updatePositionsInColumn]);

  return { handleDragEnd };
}
