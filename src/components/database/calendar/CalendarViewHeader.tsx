
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

  // Filter out fields with empty IDs and log for debugging
  const validDateFields = dateFields.filter(field => {
    const isValid = field.id && field.id.trim() !== '';
    if (!isValid) {
      console.warn('CalendarViewHeader: Filtering out field with empty ID:', field);
    }
    return isValid;
  });

  console.log('CalendarViewHeader: Valid date fields:', validDateFields);

  const handleDateFieldChange = (value: string) => {
    console.log('CalendarViewHeader: Field change value:', value);
    // Only proceed if the value is not empty
    if (value && value.trim() !== '') {
      const field = validDateFields.find(f => f.id === value);
      onDateFieldChange(field || null);
    }
  };

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
            onValueChange={handleDateFieldChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select date field" />
            </SelectTrigger>
            <SelectContent>
              {validDateFields.map(field => {
                if (!field.id || field.id.trim() === '') {
                  console.error('CalendarViewHeader: Attempted to render SelectItem with empty ID:', field);
                  return null;
                }
                return (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
