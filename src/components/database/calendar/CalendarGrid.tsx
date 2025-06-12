
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface CalendarGridProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  datesWithEntries: Date[];
  totalEntries: number;
}

export function CalendarGrid({ 
  selectedDate, 
  onDateSelect, 
  datesWithEntries, 
  totalEntries 
}: CalendarGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          className="rounded-md border"
          modifiers={{
            hasEntries: datesWithEntries,
          }}
          modifiersStyles={{
            hasEntries: {
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              fontWeight: 'bold',
            },
          }}
        />
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded bg-primary"></div>
            <span>Dates with entries ({datesWithEntries.length})</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Total entries: {totalEntries}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
