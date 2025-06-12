import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GripVertical, 
  Plus, 
  Settings, 
  Trash2, 
  Copy,
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
  Users
} from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { PropertyType } from '@/types/property';
import { RegistryBasedFieldTypeSelector } from '@/components/property/RegistryBasedFieldTypeSelector';
import { useToast } from '@/hooks/use-toast';

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
  rollup: Calculator,
  users: Users,
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
  const [reorderedFields, setReorderedFields] = useState<DatabaseField[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<DatabaseField | null>(null);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<PropertyType>('text');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize reordered fields when modal opens
  React.useEffect(() => {
    if (open) {
      setReorderedFields([...fields]);
      setShowNewFieldForm(false);
      setNewFieldName('');
      setNewFieldType('text');
    }
  }, [open, fields]);

  const handleDragStart = (e: React.DragEvent, field: DatabaseField) => {
    e.dataTransfer.setData('text/plain', field.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetField: DatabaseField) => {
    e.preventDefault();
    const draggedFieldId = e.dataTransfer.getData('text/plain');
    const draggedField = reorderedFields.find(f => f.id === draggedFieldId);
    
    if (!draggedField || draggedField.id === targetField.id) return;

    const newFields = [...reorderedFields];
    const draggedIndex = newFields.findIndex(f => f.id === draggedFieldId);
    const targetIndex = newFields.findIndex(f => f.id === targetField.id);

    // Remove dragged field and insert at target position
    newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, draggedField);

    setReorderedFields(newFields);
  };

  const handleSaveOrder = async () => {
    setIsLoading(true);
    try {
      await onFieldsReorder(reorderedFields);
      toast({
        title: "Success",
        description: "Field order updated successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update field order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteField = (field: DatabaseField) => {
    setFieldToDelete(field);
    setShowDeleteDialog(true);
  };

  const confirmDeleteField = async () => {
    if (!fieldToDelete) return;

    setIsLoading(true);
    try {
      await onFieldDelete(fieldToDelete.id);
      setReorderedFields(prev => prev.filter(f => f.id !== fieldToDelete.id));
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
      setShowDeleteDialog(false);
      setFieldToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateField = async (field: DatabaseField) => {
    setIsLoading(true);
    try {
      await onFieldDuplicate(field);
      toast({
        title: "Success",
        description: "Field duplicated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateField = async () => {
    if (!newFieldName.trim()) {
      toast({
        title: "Error",
        description: "Field name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onFieldCreate({
        name: newFieldName.trim(),
        type: newFieldType,
        settings: {}
      });
      toast({
        title: "Success",
        description: "Field created successfully",
      });
      setShowNewFieldForm(false);
      setNewFieldName('');
      setNewFieldType('text');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Properties</DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-2">
                {/* Existing Fields */}
                {reorderedFields.map((field, index) => {
                  const FieldIcon = fieldTypeIcons[field.type as keyof typeof fieldTypeIcons] || Type;
                  
                  return (
                    <div
                      key={field.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, field)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, field)}
                    >
                      {/* Drag Handle */}
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                      
                      {/* Field Info */}
                      <div className="flex items-center gap-2 flex-1">
                        <div className="p-1.5 rounded-md bg-muted/60">
                          <FieldIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{field.name}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {field.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateField(field)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteField(field)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* New Field Form */}
                {showNewFieldForm && (
                  <div className="p-4 border border-dashed border-border rounded-lg bg-muted/20">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="new-field-name" className="text-sm font-medium">
                          Field Name
                        </Label>
                        <Input
                          id="new-field-name"
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                          placeholder="Enter field name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Field Type</Label>
                        <div className="mt-1">
                          <RegistryBasedFieldTypeSelector
                            value={newFieldType}
                            onValueChange={setNewFieldType}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCreateField}
                          disabled={isLoading || !newFieldName.trim()}
                          size="sm"
                        >
                          Create Field
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowNewFieldForm(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add New Field Button */}
                {!showNewFieldForm && (
                  <Button
                    variant="dashed"
                    onClick={() => setShowNewFieldForm(true)}
                    className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Property
                  </Button>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrder} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the property "{fieldToDelete?.name}"? 
              This action cannot be undone and will remove all data in this property from all rows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteField}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete Property"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
