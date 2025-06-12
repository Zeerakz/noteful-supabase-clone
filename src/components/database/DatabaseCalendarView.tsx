
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, Edit2 } from 'lucide-react';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { PagePropertyService } from '@/services/pagePropertyService';
import { DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isValid } from 'date-fns';

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

export function DatabaseCalendarView({ 
  databaseId, 
  workspaceId, 
  filters = [], 
  fields = [], 
  sortRules = [] 
}: DatabaseCalendarViewProps) {
  const { pages, loading, error } = useFilteredDatabasePages({
    databaseId,
    filters,
    fields,
    sortRules,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateField, setSelectedDateField] = useState<DatabaseField | null>(null);
  const { user } = useAuth();

  // Find all date-type fields
  const dateFields = fields.filter(field => field.type === 'date');

  // Set default date field (first one found)
  useEffect(() => {
    if (dateFields.length > 0 && !selectedDateField) {
      setSelectedDateField(dateFields[0]);
    }
  }, [dateFields, selectedDateField]);

  // Transform pages data to expected format with improved date parsing
  const pagesWithProperties: PageWithProperties[] = pages.map(page => {
    const properties: Record<string, string> = {};
    let dateValue: Date | undefined;

    (page.page_properties || []).forEach((prop: any) => {
      properties[prop.field_id] = prop.value || '';
      
      // If this property is for the selected date field, parse the date
      if (selectedDateField && prop.field_id === selectedDateField.id && prop.value) {
        try {
          const parsedDate = parseISO(prop.value);
          if (isValid(parsedDate)) {
            dateValue = parsedDate;
          }
        } catch {
          // Invalid date format, ignore
        }
      }
    });
    
    return {
      pageId: page.id,
      title: page.title,
      properties,
      dateValue,
    };
  });

  // Get pages for the selected date
  const getPagesForDate = (date: Date): PageWithProperties[] => {
    if (!selectedDateField) return [];
    
    return pagesWithProperties.filter(page => {
      if (!page.dateValue) return false;
      return format(page.dateValue, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  // Get all dates that have entries for highlighting
  const getDatesWithEntries = (): Date[] => {
    if (!selectedDateField) return [];
    
    return pagesWithProperties
      .filter(page => page.dateValue)
      .map(page => page.dateValue!)
      .filter((date, index, self) => 
        self.findIndex(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) === index
      );
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
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Calendar View</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Viewing entries by</span>
            {dateFields.length > 1 ? (
              <select
                value={selectedDateField?.id || ''}
                onChange={(e) => {
                  const field = dateFields.find(f => f.id === e.target.value);
                  setSelectedDateField(field || null);
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar Component */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendar</CardTitle>
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
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span>Dates with entries ({datesWithEntries.length})</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Total entries: {pagesWithProperties.filter(p => p.dateValue).length}
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
      </div>

      {/* Empty State */}
      {pagesWithProperties.filter(p => p.dateValue).length === 0 && (
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
      )}
    </div>
  );
}

interface CalendarEntryCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  selectedDateField: DatabaseField | null;
}

function CalendarEntryCard({ page, fields, selectedDateField }: CalendarEntryCardProps) {
  // Show first few non-date fields (excluding the currently selected date field)
  const displayFields = fields
    .filter(field => field.type !== 'date' || field.id !== selectedDateField?.id)
    .slice(0, 3);

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm flex-1">{page.title || 'Untitled'}</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
      
      {displayFields.length > 0 && (
        <div className="space-y-1">
          {displayFields.map((field) => (
            <div key={field.id} className="text-xs">
              <span className="text-muted-foreground">{field.name}:</span>{' '}
              <span className="text-foreground">
                {page.properties[field.id] || 'Empty'}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Show the date field value if it's not the primary one being used for calendar */}
      {page.dateValue && (
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          {format(page.dateValue, 'h:mm a')}
        </div>
      )}
    </div>
  );
}
