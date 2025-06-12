
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  MoreHorizontal, 
  GripVertical, 
  Copy, 
  Trash2, 
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Link,
  Mail,
  Phone,
  Tag,
  Tags,
  File,
  Image as ImageIcon,
  Calculator,
  Database,
  TrendingUp
} from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { PropertyType } from '@/types/property';
import { FieldTypeSelector } from './FieldTypeSelector';
import { FieldConfigurationPanel } from './FieldConfigurationPanel';

interface ManagePropertiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: DatabaseField[];
  onFieldsReorder: (fields: DatabaseField[]) => Promise<void>;
  onFieldUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onFieldDuplicate: (field: DatabaseField) => Promise<void>;
  onFieldDelete: (fieldId: string) => Promise<void>;
  onFieldCreate: (field: { name: string; type: PropertyType; settings?: any }) => Promise<void>;
}

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  checkbox: CheckSquare,
  url: Link,
  email: Mail,
  phone: Phone,
  select: Tag,
  multi_select: Tags,
  file_attachment: File,
  image: ImageIcon,
  formula: Calculator,
  relation: Database,
  rollup: TrendingUp,
};

export function ManagePropertiesModal({ 
  open, 
  onOpenChange, 
  fields,
  onFieldsReorder,
  onFieldUpdate,
  onFieldDuplicate,
  onFieldDelete,
  onFieldCreate
}: ManagePropertiesModalProps) {
  const [editingField, setEditingField] = useState<DatabaseField | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<PropertyType>('text');
  const [newFieldSettings, setNewFieldSettings] = useState<any>({});
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
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await onFieldDelete(fieldId);
      setDeleteFieldId(null);
    } catch (error) {
      console.error('Failed to delete field:', error);
    }
  };

  const handleDuplicateField = async (field: DatabaseField) => {
    try {
      await onFieldDuplicate(field);
    } catch (error) {
      console.error('Failed to duplicate field:', error);
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) return;
    
    try {
      await onFieldCreate({
        name: newFieldName,
        type: newFieldType,
        settings: newFieldSettings
      });
      
      // Reset form
      setNewFieldName('');
      setNewFieldType('text');
      setNewFieldSettings({});
      setShowAddField(false);
    } catch (error) {
      console.error('Failed to create field:', error);
    }
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

  const getFieldIcon = (type: string) => {
    const IconComponent = fieldTypeIcons[type as keyof typeof fieldTypeIcons] || Type;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Properties</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-6 h-[60vh]">
            {/* Properties List */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Properties</h3>
                <Button
                  size="sm"
                  onClick={() => setShowAddField(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Property
                </Button>
              </div>
              
              <ScrollArea className="h-full border rounded-lg">
                <div className="p-2 space-y-1">
                  {fields.map((field, index) => {
                    const isEditing = editingField?.id === field.id;
                    const isDragOver = dragOverIndex === index;
                    
                    return (
                      <div
                        key={field.id}
                        className={`
                          group flex items-center gap-3 p-3 rounded-lg border
                          ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                          ${isEditing ? 'ring-2 ring-primary' : ''}
                        `}
                        draggable
                        onDragStart={() => handleDragStart(field)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        {/* Field Icon */}
                        <div className="flex-shrink-0">
                          {getFieldIcon(field.type)}
                        </div>
                        
                        {/* Field Info */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <Input
                              value={editingField.name}
                              onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                              className="text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-sm">{field.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {field.type.replace('_', ' ')}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Type Badge */}
                        <Badge variant="secondary" className="text-xs">
                          {field.type.replace('_', ' ')}
                        </Badge>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="opacity-0 group-hover:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setEditingField(field)}
                                >
                                  Edit Property
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDuplicateField(field)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteFieldId(field.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
            
            {/* Add/Edit Panel */}
            {(showAddField || editingField) && (
              <>
                <Separator orientation="vertical" />
                <div className="w-80">
                  <h3 className="text-sm font-medium mb-4">
                    {editingField ? 'Edit Property' : 'Add Property'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-name">Property Name</Label>
                      <Input
                        id="field-name"
                        value={editingField ? editingField.name : newFieldName}
                        onChange={(e) => {
                          if (editingField) {
                            setEditingField({ ...editingField, name: e.target.value });
                          } else {
                            setNewFieldName(e.target.value);
                          }
                        }}
                        placeholder="Enter property name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="field-type">Property Type</Label>
                      <FieldTypeSelector
                        value={editingField ? editingField.type as PropertyType : newFieldType}
                        onValueChange={(type) => {
                          if (editingField) {
                            setEditingField({ ...editingField, type });
                          } else {
                            setNewFieldType(type);
                          }
                        }}
                        disabled={!!editingField}
                      />
                    </div>
                    
                    {/* Field Configuration */}
                    <FieldConfigurationPanel
                      fieldType={editingField ? editingField.type as PropertyType : newFieldType}
                      settings={editingField ? editingField.settings : newFieldSettings}
                      onSettingsChange={(settings) => {
                        if (editingField) {
                          setEditingField({ ...editingField, settings });
                        } else {
                          setNewFieldSettings(settings);
                        }
                      }}
                      availableFields={fields}
                      workspaceId=""
                    />
                    
                    <div className="flex gap-2 pt-4">
                      {editingField ? (
                        <>
                          <Button onClick={handleSaveEdit} className="flex-1">
                            Save Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingField(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={handleAddField} className="flex-1">
                            Add Property
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAddField(false)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFieldId} onOpenChange={() => setDeleteFieldId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone
              and will remove all data in this property for all entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFieldId && handleDeleteField(deleteFieldId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
