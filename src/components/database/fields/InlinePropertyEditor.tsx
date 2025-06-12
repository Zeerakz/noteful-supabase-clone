
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Settings, Trash2, Copy } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { PropertyType } from '@/types/property';
import { RegistryBasedFieldTypeSelector } from '@/components/property/RegistryBasedFieldTypeSelector';
import { RegistryBasedPropertyConfigEditor } from '@/components/property/RegistryBasedPropertyConfigEditor';
import { useToast } from '@/hooks/use-toast';

interface InlinePropertyEditorProps {
  field: DatabaseField;
  onUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onDuplicate: (field: DatabaseField) => Promise<void>;
  onDelete: (fieldId: string) => Promise<void>;
  children: React.ReactNode;
}

export function InlinePropertyEditor({
  field,
  onUpdate,
  onDuplicate,
  onDelete,
  children
}: InlinePropertyEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fieldName, setFieldName] = useState(field.name);
  const [fieldType, setFieldType] = useState<PropertyType>(field.type as PropertyType);
  const [fieldSettings, setFieldSettings] = useState(field.settings || {});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!fieldName.trim()) {
      toast({
        title: "Error",
        description: "Field name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(field.id, {
        name: fieldName.trim(),
        type: fieldType,
        settings: fieldSettings
      });
      
      toast({
        title: "Success",
        description: "Field updated successfully",
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setIsLoading(true);
    try {
      await onDuplicate(field);
      toast({
        title: "Success",
        description: "Field duplicated successfully",
      });
      setIsOpen(false);
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

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(field.id);
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
      setShowDeleteDialog(false);
      setIsOpen(false);
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

  // Reset form when field changes or popover opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFieldName(field.name);
      setFieldType(field.type as PropertyType);
      setFieldSettings(field.settings || {});
    }
    setIsOpen(open);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-96 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Edit Field</h4>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Field Name */}
            <div className="space-y-2">
              <Label htmlFor="field-name" className="text-xs font-medium">
                Field Name
              </Label>
              <Input
                id="field-name"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Enter field name"
                className="h-8"
              />
            </div>

            {/* Field Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Field Type</Label>
              <RegistryBasedFieldTypeSelector
                value={fieldType}
                onValueChange={setFieldType}
              />
            </div>

            {/* Field Configuration */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Configuration</Label>
              <div className="border rounded-md p-3 bg-muted/20">
                <RegistryBasedPropertyConfigEditor
                  propertyType={fieldType}
                  config={fieldSettings}
                  onConfigChange={setFieldSettings}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  size="sm"
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleDuplicate}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Duplicate
                </Button>
              </div>
              
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Delete Field
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the field "{field.name}"? This action cannot be undone and will remove all data in this field from all rows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete Field"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
