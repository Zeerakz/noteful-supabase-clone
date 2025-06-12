
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Plus } from 'lucide-react';

interface ListEmptyStateProps {
  onCreateEntry: () => void;
}

export function ListEmptyState({ onCreateEntry }: ListEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <Edit className="h-12 w-12 text-muted-foreground mx-auto" />
      </div>
      <h3 className="text-lg font-medium mb-2">No entries yet</h3>
      <p className="text-muted-foreground mb-4">
        Create your first database entry to see it as a card here.
      </p>
      <Button className="gap-2" onClick={onCreateEntry}>
        <Plus className="h-4 w-4" />
        Create First Entry
      </Button>
    </div>
  );
}
