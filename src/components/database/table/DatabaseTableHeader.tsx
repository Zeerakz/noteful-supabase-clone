
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DatabaseTableHeaderProps {
  onCreateRow: () => void;
}

export function DatabaseTableHeader({ onCreateRow }: DatabaseTableHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Table View</h3>
        <p className="text-sm text-muted-foreground">
          View and edit your database entries in a table format
        </p>
      </div>
      <Button onClick={onCreateRow} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Row
      </Button>
    </div>
  );
}
