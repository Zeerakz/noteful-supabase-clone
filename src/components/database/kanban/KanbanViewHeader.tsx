
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DatabaseField } from '@/types/database';

interface KanbanViewHeaderProps {
  selectFields: DatabaseField[];
  selectedField: DatabaseField | null;
  onFieldChange: (field: DatabaseField | null) => void;
}

export function KanbanViewHeader({ 
  selectFields, 
  selectedField, 
  onFieldChange 
}: KanbanViewHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Kanban View</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Grouped by</span>
          {selectFields.length > 1 ? (
            <select
              value={selectedField?.id || ''}
              onChange={(e) => {
                const field = selectFields.find(f => f.id === e.target.value);
                onFieldChange(field || null);
              }}
              className="bg-background border border-input rounded px-2 py-1 text-sm"
            >
              {selectFields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-medium">{selectedField?.name}</span>
          )}
        </div>
      </div>
      <Button size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Card
      </Button>
    </div>
  );
}
