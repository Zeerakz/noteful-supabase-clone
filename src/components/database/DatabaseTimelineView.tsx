
import React, { useState } from 'react';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { TimelineViewMode } from './timeline/types';
import { TimelineViewHeader } from './timeline/TimelineViewHeader';
import { TimelineContent } from './timeline/TimelineContent';
import { useTimelineData } from '@/hooks/database/useTimelineData';
import { Skeleton } from '@/components/ui/skeleton';

interface DatabaseTimelineViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
}

export function DatabaseTimelineView({
  databaseId,
  workspaceId,
  fields,
  filterGroup,
  sortRules
}: DatabaseTimelineViewProps) {
  const dateFields = fields.filter(field => field.type === 'date' || field.type === 'timestamp');
  const [selectedStartField, setSelectedStartField] = useState<DatabaseField | null>(
    dateFields[0] || null
  );
  const [selectedEndField, setSelectedEndField] = useState<DatabaseField | null>(null);
  const [viewMode, setViewMode] = useState<TimelineViewMode>('week');

  const {
    timelineItems,
    timelineRange,
    loading,
    error,
    refetch
  } = useTimelineData({
    databaseId,
    fields,
    filterGroup,
    sortRules,
    startDateField: selectedStartField,
    endDateField: selectedEndField,
    viewMode
  });

  const handleDragEnd = (result: any) => {
    // For now, just log the drag result
    // In a full implementation, this would update the item's date based on the new position
    console.log('Timeline drag ended:', result);
  };

  if (dateFields.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p>No date or timestamp fields found in this database.</p>
          <p className="text-sm mt-1">Add a date or timestamp field to use the timeline view.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-destructive">
          <p>Error loading timeline data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TimelineViewHeader
        dateFields={dateFields}
        selectedStartField={selectedStartField}
        selectedEndField={selectedEndField}
        viewMode={viewMode}
        onStartFieldChange={setSelectedStartField}
        onEndFieldChange={setSelectedEndField}
        onViewModeChange={setViewMode}
      />

      <div className="border rounded-lg overflow-auto">
        <TimelineContent
          items={timelineItems}
          fields={fields}
          viewMode={viewMode}
          startDate={timelineRange.startDate}
          endDate={timelineRange.endDate}
          onDragEnd={handleDragEnd}
        />
      </div>
    </div>
  );
}
