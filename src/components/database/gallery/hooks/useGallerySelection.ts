
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deletePage } from '@/services/pageMutationService';

export function useGallerySelection() {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handlePageSelect = (pageId: string, selected: boolean) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(pageId);
      } else {
        newSet.delete(pageId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (pageIds: string[]) => {
    setSelectedPages(new Set(pageIds));
  };

  const handleClearSelection = () => {
    setSelectedPages(new Set());
  };

  const handleBulkDelete = async (refetch: () => void) => {
    if (selectedPages.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedPages).map(pageId => deletePage(pageId))
      );
      
      toast({
        title: "Success",
        description: `Deleted ${selectedPages.size} entries`,
      });
      
      setSelectedPages(new Set());
      refetch();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete selected entries",
        variant: "destructive",
      });
    }
  };

  return {
    selectedPages,
    handlePageSelect,
    handleSelectAll,
    handleClearSelection,
    handleBulkDelete
  };
}
