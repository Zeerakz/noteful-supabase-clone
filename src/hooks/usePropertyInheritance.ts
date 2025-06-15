
import { useState } from 'react';
import { PropertyInheritanceService } from '@/services/propertyInheritanceService';
import { useAuth } from '@/contexts/AuthContext';
import { useGentleErrorHandler } from './useGentleErrorHandler';

export function usePropertyInheritance() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { handleSuccess, handlePermissionError, handleSaveError } = useGentleErrorHandler();

  const applyDatabaseInheritance = async (pageId: string, databaseId: string) => {
    if (!user) {
      handlePermissionError('You must be logged in to perform this action.');
      return { success: false };
    }

    setLoading(true);
    try {
      const { error } = await PropertyInheritanceService.applyDatabaseInheritance(pageId, databaseId, user.id);
      
      if (error) {
        handleSaveError('Failed to Apply Properties', error);
        return { success: false };
      }

      handleSuccess('Database properties have been applied to the page.');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      handleSaveError('An unexpected error occurred', message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { loading, applyDatabaseInheritance };
}
