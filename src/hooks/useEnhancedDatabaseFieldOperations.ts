
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DatabaseFieldService } from '@/services/database/databaseFieldService';
import { DatabaseField, FieldType } from '@/types/database';
import { PropertyType } from '@/types/property';

interface UseEnhancedDatabaseFieldOperationsProps {
  databaseId: string;
  onOptimisticCreate: (field: Partial<DatabaseField>) => string;
  onOptimisticUpdate: (fieldId: string, updates: Partial<DatabaseField>) => void;
  onOptimisticDelete: (fieldId: string) => void;
  onOptimisticReorder: (fields: DatabaseField[]) => void;
  onRevert: () => void;
  onFieldsChange?: () => void;
}

export function useEnhancedDatabaseFieldOperations({
  databaseId,
  onOptimisticCreate,
  onOptimisticUpdate,
  onOptimisticDelete,
  onOptimisticReorder,
  onRevert,
  onFieldsChange,
}: UseEnhancedDatabaseFieldOperationsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const createField = async (field: { name: string; type: PropertyType; settings?: any }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    if (field.type === 'unsupported') {
      toast({
        title: 'Invalid Field Type',
        description: 'Cannot create a field with an unsupported type.',
        variant: 'destructive',
      });
      return;
    }

    // Optimistic update
    const tempId = onOptimisticCreate(field as Partial<DatabaseField>);

    try {
      const { data, error } = await DatabaseFieldService.createDatabaseField(
        databaseId,
        user.id,
        field as { name: string; type: FieldType; settings?: any }
      );
      
      if (error) throw new Error(error.message);
      
      // Success - let the server sync handle the real data
      onFieldsChange?.();
      
      toast({
        title: "Success",
        description: "Field created successfully",
      });
    } catch (error) {
      console.error('Failed to create field:', error);
      onRevert();
      toast({
        title: "Error Creating Field",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateField = async (fieldId: string, updates: Partial<DatabaseField>) => {
    // Optimistic update
    onOptimisticUpdate(fieldId, updates);

    try {
      const { error } = await DatabaseFieldService.updateDatabaseField(fieldId, updates);
      
      if (error) throw new Error(error.message);
      
      onFieldsChange?.();
    } catch (error) {
      console.error('Failed to update field:', error);
      onRevert();
      toast({
        title: "Error Updating Field",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteField = async (fieldId: string) => {
    // Optimistic update
    onOptimisticDelete(fieldId);

    try {
      const { error } = await DatabaseFieldService.deleteDatabaseField(fieldId);
      
      if (error) throw new Error(error.message);
      
      onFieldsChange?.();
      
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete field:', error);
      onRevert();
      toast({
        title: "Error Deleting Field",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const reorderFields = async (fields: DatabaseField[]) => {
    // Optimistic update
    onOptimisticReorder(fields);

    try {
      const updates = fields.map((field, index) => 
        DatabaseFieldService.updateDatabaseField(field.id, { pos: index })
      );

      await Promise.all(updates);
      onFieldsChange?.();
    } catch (error) {
      console.error('Failed to reorder fields:', error);
      onRevert();
      toast({
        title: "Error Reordering Fields",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const duplicateField = async (field: DatabaseField) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    const duplicatedField = {
      name: `${field.name} (Copy)`,
      type: field.type,
      settings: field.settings
    };

    // Optimistic update
    const tempId = onOptimisticCreate(duplicatedField);

    try {
      const { error } = await DatabaseFieldService.createDatabaseField(
        databaseId,
        user!.id, // user is checked above
        duplicatedField
      );
      
      if (error) throw new Error(error.message);
      
      onFieldsChange?.();
      
      toast({
        title: "Success",
        description: "Field duplicated successfully",
      });
    } catch (error) {
      console.error('Failed to duplicate field:', error);
      onRevert();
      toast({
        title: "Error Duplicating Field",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    createField,
    updateField,
    deleteField,
    reorderFields,
    duplicateField,
  };
}
