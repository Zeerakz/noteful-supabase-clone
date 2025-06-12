
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DatabaseFieldService } from '@/services/database/databaseFieldService';
import { DatabaseField } from '@/types/database';
import { PropertyType } from '@/types/property';

export function useDatabaseFieldOperations(databaseId: string, onFieldsChange?: () => void) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const updateField = async (fieldId: string, updates: Partial<DatabaseField>): Promise<void> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await DatabaseFieldService.updateDatabaseField(fieldId, updates);
      
      if (error) {
        throw new Error(error);
      }

      onFieldsChange?.();
    } catch (error) {
      console.error('Failed to update field:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const duplicateField = async (field: DatabaseField): Promise<void> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const duplicatedField = {
        name: `${field.name} (Copy)`,
        type: field.type,
        settings: field.settings
      };

      const { data, error } = await DatabaseFieldService.createDatabaseField(
        databaseId,
        user.id,
        duplicatedField
      );
      
      if (error) {
        throw new Error(error);
      }

      onFieldsChange?.();
    } catch (error) {
      console.error('Failed to duplicate field:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteField = async (fieldId: string): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await DatabaseFieldService.deleteDatabaseField(fieldId);
      
      if (error) {
        throw new Error(error);
      }

      onFieldsChange?.();
    } catch (error) {
      console.error('Failed to delete field:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createField = async (field: { name: string; type: PropertyType; settings?: any }): Promise<void> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await DatabaseFieldService.createDatabaseField(
        databaseId,
        user.id,
        field
      );
      
      if (error) {
        throw new Error(error);
      }

      onFieldsChange?.();
    } catch (error) {
      console.error('Failed to create field:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reorderFields = async (fields: DatabaseField[]): Promise<void> => {
    setLoading(true);
    try {
      // Update position for each field
      const updates = fields.map((field, index) => 
        DatabaseFieldService.updateDatabaseField(field.id, { pos: index })
      );

      await Promise.all(updates);
      onFieldsChange?.();
    } catch (error) {
      console.error('Failed to reorder fields:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateField,
    duplicateField,
    deleteField,
    createField,
    reorderFields,
  };
}
