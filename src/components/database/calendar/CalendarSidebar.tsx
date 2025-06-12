
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEntryCard } from './CalendarEntryCard';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
  dateValue?: Date;
}

interface CalendarSidebarProps {
  selectedDate: Date | undefined;
  selectedDatePages: PageWithProperties[];
  fields: DatabaseField[];
  selectedDateField: DatabaseField | null;
}

export function CalendarSidebar({ 
  selectedDate, 
  selectedDatePages, 
  fields, 
  selectedDateField 
}: CalendarSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedDate ? (
          selectedDatePages.length > 0 ? (
            <div className="space-y-3">
              {selectedDatePages.map((page) => (
                <CalendarEntryCard
                  key={page.pageId}
                  page={page}
                  fields={fields}
                  selectedDateField={selectedDateField}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No entries for this date
              </p>
              <Button size="sm" className="gap-2">
                <Plus className="h-3 w-3" />
                Add Entry for {format(selectedDate, 'MMM d')}
              </Button>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Select a date to view entries
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
