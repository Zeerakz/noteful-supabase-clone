
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { CalendarViewHeader } from './calendar/CalendarViewHeader';
import { CalendarGrid } from './calendar/CalendarGrid';
import { CalendarSidebar } from './calendar/CalendarSidebar';
import { 
  NoDateFieldEmptyState, 
  NoEntriesEmptyState, 
  LoadingState, 
  ErrorState 
} from './calendar/CalendarEmptyStates';
import { useCalendarData } from './calendar/hooks/useCalendarData';

interface DatabaseCalendarViewProps {
  databaseId: string;
  workspaceId: string;
  filterGroup?: FilterGroup;
  fields?: DatabaseField[];
  sortRules?: SortRule[];
}

export function DatabaseCalendarView({ 
  databaseId, 
  workspaceId, 
  filterGroup, 
  fields = [], 
  sortRules = [] 
}: DatabaseCalendarViewProps) {
  const { user } = useAuth();
  const {
    loading,
    error,
    dateFields,
    selectedDateField,
    setSelectedDateField,
    selectedDate,
    setSelectedDate,
    pagesWithProperties,
    datesWithEntries,
    selectedDatePages,
    hasDateFields,
    hasValidDateField,
  } = useCalendarData({ databaseId, filterGroup, fields, sortRules });

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Show validation when no date fields are available
  if (!hasDateFields) {
    return <NoDateFieldEmptyState />;
  }

  // Show validation when no valid date field is selected
  if (!hasValidDateField) {
    return <NoDateFieldEmptyState />;
  }

  return (
    <div className="space-y-6">
      <CalendarViewHeader
        dateFields={dateFields}
        selectedDateField={selectedDateField}
        onDateFieldChange={setSelectedDateField}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <CalendarGrid
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          datesWithEntries={datesWithEntries}
          totalEntries={pagesWithProperties.filter(p => p.dateValue).length}
        />

        <CalendarSidebar
          selectedDate={selectedDate}
          selectedDatePages={selectedDatePages}
          fields={fields}
          selectedDateField={selectedDateField}
        />
      </div>

      {/* Empty State for when no entries have dates */}
      {pagesWithProperties.filter(p => p.dateValue).length === 0 && (
        <NoEntriesEmptyState />
      )}
    </div>
  );
}
