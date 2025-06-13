
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays } from 'lucide-react';
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
  if (dateFields.length === 0) {
    return null; // Don't render header if no date fields
  }

  // Filter out fields with empty IDs to prevent Select.Item errors
  const validDateFields = dateFields.filter(field => field.id && field.id.trim() !== '');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-medium">Calendar View</h3>
      </div>
      
      {validDateFields.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Date field:</span>
          <Select
            value={selectedDateField?.id || ''}
            onValueChange={(value) => {
              const field = validDateFields.find(f => f.id === value);
              onDateFieldChange(field || null);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select date field" />
            </SelectTrigger>
            <SelectContent>
              {validDateFields.map(field => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
