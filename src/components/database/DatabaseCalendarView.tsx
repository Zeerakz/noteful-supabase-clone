
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CalendarDays, Settings } from 'lucide-react';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { FieldDisplay } from './fields/FieldDisplay';

interface DatabaseCalendarViewProps {
  databaseId: string;
  workspaceId: string;
  filters?: FilterRule[];
  fields?: DatabaseField[];
  sortRules?: SortRule[];
}

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
  dateValue?: Date;
}

export function DatabaseCalendarView({ databaseId, workspaceId, filters = [], fields = [], sortRules = [] }: DatabaseCalendarViewProps) {
  const { pages, loading, error } = useFilteredDatabasePages({
    databaseId,
    filters,
    fields,
    sortRules,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateFieldId, setSelectedDateFieldId] = useState<string>('');
  const { user } = useAuth();

  // Find all date-type fields
  const dateFields = fields.filter(field => field.type === 'date');

  // Set default date field
  useEffect(() => {
    if (dateFields.length > 0 && !selectedDateFieldId) {
      setSelectedDateFieldId(dateFields[0].id);
    }
  }, [dateFields, selectedDateFieldId]);

  // Get the currently selected date field
  const selectedDateField = dateFields.find(field => field.id === selectedDateFieldId);

  // Transform pages data to expected format
  const pagesWithProperties: PageWithProperties[] = pages.map(page => {
    const properties: Record<string, string> = {};
    (page.page_properties || []).forEach((prop: any) => {
      properties[prop.field_id] = prop.value || '';
    });
    
    return {
      pageId: page.id,
      title: page.title,
      properties,
    };
  });

  // Get pages for the selected date
  const getPagesForDate = (date: Date): PageWithProperties[] => {
    if (!selectedDateField) return [];
    
    return pagesWithProperties.filter(page => {
      const pageDateValue = page.properties[selectedDateField.id];
      if (!pageDateValue) return false;
      
      try {
        const pageDate = parseISO(pageDateValue);
        return format(pageDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      } catch {
        return false;
      }
    });
  };

  // Get all dates that have entries
  const getDatesWithEntries = (): Date[] => {
    if (!selectedDateField) return [];
    
    const dates: Date[] = [];
    pagesWithProperties.forEach(page => {
      const pageDateValue = page.properties[selectedDateField.id];
      if (pageDateValue) {
        try {
          const date = parseISO(pageDateValue);
          dates.push(date);
        } catch {
          // Invalid date, skip
        }
      }
    });
    
    return dates;
  };

  const datesWithEntries = getDatesWithEntries();
  const selectedDatePages = selectedDate ? getPagesForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (dateFields.length === 0) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-medium">Calendar View</h3>
            <p className="text-sm text-muted-foreground">
              Viewing entries by date field
            </p>
          </div>
          
          {dateFields.length > 1 && (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedDateFieldId} onValueChange={setSelectedDateFieldId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select date field" />
                </SelectTrigger>
                <SelectContent>
                  {dateFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar Component */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Calendar - {selectedDateField?.name || 'Date Field'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
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
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span>Dates with entries</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Entries */}
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
                      selectedDateFieldId={selectedDateFieldId}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No entries for this date
                  </p>
                  <Button size="sm" className="mt-3 gap-2">
                    <Plus className="h-3 w-3" />
                    Add Entry
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
      </div>

      {pages.length === 0 && (
        <div className="text-center py-8">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No entries yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first database entry to see it on the calendar.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Entry
          </Button>
        </div>
      )}
    </div>
  );
}

interface CalendarEntryCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  selectedDateFieldId: string;
}

function CalendarEntryCard({ page, fields, selectedDateFieldId }: CalendarEntryCardProps) {
  // Show first few non-date fields that aren't the selected date field
  const displayFields = fields
    .filter(field => field.type !== 'date' || field.id !== selectedDateFieldId)
    .slice(0, 3);

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer">
      <h4 className="font-medium text-sm mb-2">{page.title || 'Untitled'}</h4>
      {displayFields.length > 0 && (
        <div className="space-y-1">
          {displayFields.map((field) => (
            <div key={field.id} className="text-xs flex items-center gap-1">
              <span className="text-muted-foreground font-medium">{field.name}:</span>
              <FieldDisplay
                field={field}
                value={page.properties[field.id] || null}
                pageId={page.pageId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
