
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { PropertyListItem } from './PropertyListItem';

interface PropertyListProps {
  fields: DatabaseField[];
  editingField: DatabaseField | null;
  onEditingFieldChange: (field: DatabaseField | null) => void;
  onFieldsReorder: (fields: DatabaseField[]) => Promise<void>;
  onFieldUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onFieldDuplicate: (field: DatabaseField) => Promise<void>;
  onFieldDelete: (fieldId: string) => Promise<void>;
  onAddProperty: () => void;
}

export function PropertyList({
  fields,
  editingField,
  onEditingFieldChange,
  onFieldsReorder,
  onFieldUpdate,
  onFieldDuplicate,
  onFieldDelete,
  onAddProperty
}: PropertyListProps) {
  const [draggedField, setDraggedField] = useState<DatabaseField | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleSaveEdit = async () => {
    if (!editingField) return;
    
    try {
      await onFieldUpdate(editingField.id, {
        name: editingField.name,
        type: editingField.type,
        settings: editingField.settings
      });
      onEditingFieldChange(null);
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  const handleCancelEdit = () => {
    onEditingFieldChange(null);
  };

  const handleDragStart = (field: DatabaseField) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedField) return;
    
    const currentIndex = fields.findIndex(f => f.id === draggedField.id);
    if (currentIndex === -1 || currentIndex === targetIndex) return;
    
    // Create new array with reordered fields
    const newFields = [...fields];
    newFields.splice(currentIndex, 1);
    newFields.splice(targetIndex, 0, draggedField);
    
    // Update positions
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      pos: index
    }));
    
    try {
      await onFieldsReorder(updatedFields);
    } catch (error) {
      console.error('Failed to reorder fields:', error);
    }
    
    setDraggedField(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Properties</h3>
        <Button
          size="sm"
          onClick={onAddProperty}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>
      
      <ScrollArea className="h-full border rounded-lg">
        <div className="p-2 space-y-1">
          {fields.map((field, index) => (
            <PropertyListItem
              key={field.id}
              field={field}
              index={index}
              isEditing={editingField?.id === field.id}
              editingField={editingField}
              isDragOver={dragOverIndex === index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onEditStart={onEditingFieldChange}
              onEditChange={onEditingFieldChange}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDuplicate={onFieldDuplicate}
              onDelete={onFieldDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
