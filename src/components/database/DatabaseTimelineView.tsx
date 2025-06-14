
import React from 'react';
import { TimelineViewHeader } from './timeline/TimelineViewHeader';
import { TimelineContent } from './timeline/TimelineContent';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from './SortingModal';
import { useTimelineData } from '@/hooks/database/useTimelineData';
import { useFilteredDatabasePagesQuery } from '@/hooks/useFilteredDatabasePagesQuery';

interface DatabaseTimelineViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  onFieldsChange?: () => void;
}

export function DatabaseTimelineView({ 
  databaseId, 
  workspaceId, 
  fields, 
  filterGroup,
  sortRules,
  setSortRules,
  onFieldsChange
}: DatabaseTimelineViewProps) {
  // Get filtered pages data
  const { pages, loading, error } = useFilteredDatabasePagesQuery({
    databaseId,
    filterGroup,
    fields,
    sortRules
  });

  // Filter date fields and ensure they have valid IDs before passing to header
  const dateFields = fields.filter(field => {
    const isDateType = field.type === 'date' || field.type === 'datetime';
    const hasValidId = field.id && field.id.trim() !== '';
    
    if (isDateType && !hasValidId) {
      console.warn('DatabaseTimelineView: Filtering out date field with empty ID:', field);
    }
    
    return isDateType && hasValidId;
  });

  console.log('DatabaseTimelineView: Valid date fields for timeline:', dateFields);

  const {
    selectedStartField,
    selectedEndField,
    viewMode,
    timelineItems,
    timelineRange,
    setSelectedStartField,
    setSelectedEndField,
    setViewMode
  } = useTimelineData({
    databaseId,
    fields: dateFields, // Pass filtered fields
    pages
  });

  const handleDragEnd = (result: any) => {
    // Handle drag and drop logic here if needed
    console.log('Timeline drag end:', result);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-destructive">Error loading timeline: {error}</div>
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
      <TimelineContent
        items={timelineItems}
        fields={fields}
        viewMode={viewMode}
        startDate={timelineRange.startDate}
        endDate={timelineRange.endDate}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}
