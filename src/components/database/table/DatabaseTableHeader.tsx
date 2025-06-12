
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DatabaseTableHeaderProps {
  onCreateRow: () => void;
}

export function DatabaseTableHeader({ onCreateRow }: DatabaseTableHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">Database Table View</h3>
      <Button onClick={onCreateRow} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Row
      </Button>
    </div>
  );
}
