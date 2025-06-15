
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Loader2 } from 'lucide-react';
import { usePropertyInheritance } from '@/hooks/usePropertyInheritance';

interface PropertyInheritanceButtonProps {
  pageId: string;
  databaseId: string;
  onSuccess?: () => void;
  variant?: 'default' | 'ghost' | 'outline';
}

export function PropertyInheritanceButton({ 
  pageId, 
  databaseId, 
  onSuccess,
  variant = 'outline'
}: PropertyInheritanceButtonProps) {
  const { loading, applyDatabaseInheritance } = usePropertyInheritance();

  const handleApplyInheritance = async () => {
    const result = await applyDatabaseInheritance(pageId, databaseId);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size="sm" 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Apply Database Properties
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apply Database Properties</AlertDialogTitle>
          <AlertDialogDescription>
            This will add all current database fields as properties to this page with their default values. 
            Existing properties will not be overwritten.
            <br /><br />
            This action cannot be undone, but individual properties can be modified or removed later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleApplyInheritance} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Applying...
              </>
            ) : (
              'Apply Properties'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
