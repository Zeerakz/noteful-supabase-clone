
import React from 'react';
import { Button } from '@/components/ui/button';
import { Images, Plus } from 'lucide-react';

interface GalleryEmptyStateProps {
  onCreateEntry: () => void;
}

export function GalleryEmptyState({ onCreateEntry }: GalleryEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No Entries Found</h3>
      <p className="text-muted-foreground mb-4">
        Create your first database entry to see it in the gallery.
      </p>
      <Button className="gap-2" onClick={onCreateEntry}>
        <Plus className="h-4 w-4" />
        Create First Entry
      </Button>
    </div>
  );
}
