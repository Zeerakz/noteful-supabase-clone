
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  // Filter out fields with empty IDs to prevent Select.Item errors
  const validSelectFields = selectFields.filter(field => field.id && field.id.trim() !== '');

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Kanban View</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Grouped by</span>
          {validSelectFields.length > 1 ? (
            <Select
              value={selectedField?.id || ''}
              onValueChange={(value) => {
                const field = validSelectFields.find(f => f.id === value);
                onFieldChange(field || null);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select grouping field" />
              </SelectTrigger>
              <SelectContent>
                {validSelectFields.map(field => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
