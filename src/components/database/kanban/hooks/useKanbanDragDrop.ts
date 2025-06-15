
import { useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimisticPropertyValueUpdate } from '@/hooks/useOptimisticPropertyValueUpdate';
import { toast } from '@/hooks/use-toast';
import { DatabaseField } from '@/types/database';
import { PageWithProperties } from '../types';

interface UseKanbanDragDropProps {
  fields: DatabaseField[];
  pages: PageWithProperties[];
  selectField: DatabaseField | null;
  databaseId: string;
  setPages: React.Dispatch<React.SetStateAction<PageWithProperties[]>>;
}

export function useKanbanDragDrop({
  fields,
  pages,
  selectField,
  databaseId,
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
    
    const movedPage = pages.find(page => page.pageId === pageId);
    if (!movedPage) return;

    let newValue = '';
    if (selectField.type === 'select' || selectField.type === 'status') {
      newValue = destColumnId === 'no-status' ? '' : destColumnId;
    } else if (selectField.type === 'multi_select') {
      // For multi-select, a simple approach is to set the value to the destination column
      // A more complex implementation could modify the array of selections
      newValue = destColumnId === 'no-status' ? '[]' : JSON.stringify([destColumnId]);
    }

    // Store original state for rollback
    const originalPages = [...pages];

    // Optimistic update of pages. The columns will be re-calculated by the useEffect in useKanbanData.
    setPages(prevPages => prevPages.map(page => 
      page.pageId === pageId 
        ? {
            ...page,
            properties: {
              ...page.properties,
              [selectField.id]: newValue,
            },
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

  }, [selectField, user, pages, setPages, propertyUpdateMutation, fields, databaseId]);

  return { handleDragEnd };
}
