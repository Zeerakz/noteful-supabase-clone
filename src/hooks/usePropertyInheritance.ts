
import { useState } from 'react';
import { PropertyInheritanceService } from '@/services/propertyInheritanceService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function usePropertyInheritance() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const applyDatabaseInheritance = async (pageId: string, databaseId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to perform this action.',
      });
      return { success: false };
    }

    setLoading(true);
    const { error } = await PropertyInheritanceService.applyDatabaseInheritance(pageId, databaseId, user.id);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Apply Properties',
        description: error,
      });
      return { success: false };
    }

    toast({
      title: 'Success',
      description: 'Database properties have been applied to the page.',
    });
    return { success: true };
  };

  return { loading, applyDatabaseInheritance };
}
