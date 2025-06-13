
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NoDateFieldEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Calendar View Requires Date Fields</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Calendar view requires at least one date-type field in your database to display entries on a calendar.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">To use Calendar view:</p>
            <ol className="text-sm text-muted-foreground text-left space-y-1">
              <li>1. Add a date field to your database</li>
              <li>2. Add entries with date values</li>
              <li>3. Return to Calendar view</li>
            </ol>
          </div>
          <div className="pt-2">
            <Button className="gap-2" onClick={() => {
              // This could trigger a field creation modal or redirect to properties
              console.log('Add date field clicked');
            }}>
              <Plus className="h-4 w-4" />
              Add Date Field
            </Button>
          </div>
        </CardContent>
      </Card>
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
        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
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
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">Error Loading Calendar</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    </div>
  );
}
