
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays } from 'lucide-react';

export function NoDateFieldEmptyState() {
  return (
    <div className="text-center py-12">
      <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No Date Field Available</h3>
      <p className="text-muted-foreground mb-4">
        Calendar view requires at least one date-type field in your database.
      </p>
      <p className="text-sm text-muted-foreground">
        Add a date field to your database to use the calendar view.
      </p>
    </div>
  );
}

export function NoEntriesEmptyState() {
  return (
    <div className="text-center py-8">
      <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No dated entries yet</h3>
      <p className="text-muted-foreground mb-4">
        Create your first database entry with a date to see it on the calendar.
      </p>
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        Create First Entry
      </Button>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="text-center py-8">
      <p className="text-destructive">{error}</p>
    </div>
  );
}
