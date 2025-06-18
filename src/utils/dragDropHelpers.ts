
import { DropResult } from 'react-beautiful-dnd';

export interface DragDropResult {
  type: 'page' | 'database';
  sourceId: string;
  destinationSection: string;
  destinationIndex: number;
  sourceSection: string;
}

export function parseDragDropResult(result: DropResult): DragDropResult | null {
  if (!result.destination) return null;

  const { draggableId, source, destination } = result;

  // Determine item type and source ID
  let type: 'page' | 'database';
  let sourceId: string;

  if (draggableId.startsWith('database-')) {
    type = 'database';
    sourceId = draggableId.replace('database-', '');
  } else {
    type = 'page';
    sourceId = draggableId;
  }

  return {
    type,
    sourceId,
    sourceSection: source.droppableId,
    destinationSection: destination.droppableId,
    destinationIndex: destination.index,
  };
}

export function isDragDropValid(result: DragDropResult): { isValid: boolean; error?: string } {
  // Prevent dropping pages into database sections
  if (result.type === 'page' && 
      (result.destinationSection === 'databases' || 
       result.destinationSection === 'databases-empty')) {
    return { 
      isValid: false, 
      error: 'Pages cannot be moved to the databases section' 
    };
  }

  // Prevent dropping databases into page sections  
  if (result.type === 'database' && 
      (result.destinationSection.startsWith('teamspace-') || 
       result.destinationSection.startsWith('private-') ||
       result.destinationSection.startsWith('sub-'))) {
    return { 
      isValid: false, 
      error: 'Databases cannot be moved to page sections' 
    };
  }

  // Allow same-section reordering
  if (result.sourceSection === result.destinationSection) {
    return { isValid: true };
  }

  // Allow moving databases between database sections
  if (result.type === 'database' && 
      (result.destinationSection === 'databases' || 
       result.destinationSection === 'databases-empty')) {
    return { isValid: true };
  }

  // Allow moving pages between page sections
  if (result.type === 'page' && 
      (result.destinationSection.startsWith('teamspace-') || 
       result.destinationSection.startsWith('private-') ||
       result.destinationSection.startsWith('sub-'))) {
    return { isValid: true };
  }

  return { isValid: true };
}

export function getDropZoneMessage(droppableId: string, dragType?: 'page' | 'database'): string {
  if (droppableId === 'databases' || droppableId === 'databases-empty') {
    return dragType === 'page' ? 'Pages cannot be dropped here' : 'Drop databases here';
  }
  
  if (droppableId.startsWith('teamspace-') || droppableId.startsWith('private-') || droppableId.startsWith('sub-')) {
    return dragType === 'database' ? 'Databases cannot be dropped here' : 'Drop pages here';
  }
  
  return 'Drop items here';
}
