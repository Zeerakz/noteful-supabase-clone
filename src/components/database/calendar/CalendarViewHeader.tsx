
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DatabaseField } from '@/types/database';

interface CalendarViewHeaderProps {
  dateFields: DatabaseField[];
  selectedDateField: DatabaseField | null;
  onDateFieldChange: (field: DatabaseField | null) => void;
}

export function CalendarViewHeader({ 
  dateFields, 
  selectedDateField, 
  onDateFieldChange 
}: CalendarViewHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Calendar View</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Viewing entries by</span>
          {dateFields.length > 1 ? (
            <select
              value={selectedDateField?.id || ''}
              onChange={(e) => {
                const field = dateFields.find(f => f.id === e.target.value);
                onDateFieldChange(field || null);
              }}
              className="bg-background border border-input rounded px-2 py-1 text-sm"
            >
              {dateFields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-medium">{selectedDateField?.name}</span>
          )}
        </div>
      </div>
      <Button size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Entry
      </Button>
    </div>
  );
}
