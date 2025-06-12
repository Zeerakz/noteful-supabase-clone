
import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateFieldEditorProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function DateFieldEditor({ value, onChange }: DateFieldEditorProps) {
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!value || value.trim() === '') return undefined;
    
    try {
      let parsedDate: Date;
      
      if (value.includes('T') || value.includes('Z')) {
        // ISO format or timestamp
        parsedDate = parseISO(value);
      } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        parsedDate = new Date(value + 'T00:00:00');
      } else if (value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
        // YYYY-MM-DD HH:mm:ss format (common for timestamp fields)
        parsedDate = new Date(value);
      } else {
        // Try general date parsing
        parsedDate = new Date(value);
      }
      
      return isValid(parsedDate) ? parsedDate : undefined;
    } catch {
      return undefined;
    }
  });

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      // For timestamp fields, preserve time if it exists in original value
      const hasTime = value && (value.includes('T') || value.includes(' ') || value.includes(':'));
      
      if (hasTime && value) {
        try {
          // Try to preserve the time component from the original value
          const originalDate = new Date(value);
          if (isValid(originalDate)) {
            selectedDate.setHours(originalDate.getHours());
            selectedDate.setMinutes(originalDate.getMinutes());
            selectedDate.setSeconds(originalDate.getSeconds());
            onChange(selectedDate.toISOString());
            return;
          }
        } catch {
          // Fall back to date-only format
        }
      }
      
      // Convert to ISO date string (YYYY-MM-DD format) for date fields
      const isoString = selectedDate.toISOString().split('T')[0];
      onChange(isoString);
    } else {
      onChange('');
    }
  };

  const displayText = date ? format(date, "PPP") : "Pick a date";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-transparent border-none shadow-none hover:bg-muted/50 focus-visible:ring-1",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-md" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          className="rounded-md border-0"
        />
      </PopoverContent>
    </Popover>
  );
}
