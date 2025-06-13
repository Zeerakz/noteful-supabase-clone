
import React from 'react';
import { TimelineViewHeader } from './timeline/TimelineViewHeader';
import { TimelineContent } from './timeline/TimelineContent';
import { DatabaseField } from '@/types/database';
import { useTimelineData } from '@/hooks/database/useTimelineData';

interface DatabaseTimelineViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  pages: any[];
  loading: boolean;
  error: string | null;
}

export function DatabaseTimelineView({ 
  databaseId, 
  workspaceId, 
  fields, 
  pages, 
  loading, 
  error 
}: DatabaseTimelineViewProps) {
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
    selectedDateField,
    timelineData,
    setSelectedDateField
  } = useTimelineData({
    databaseId,
    fields: dateFields, // Pass filtered fields
    pages
  });

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
        dateFields={dateFields} // Pass filtered date fields
        selectedDateField={selectedDateField}
        onDateFieldChange={setSelectedDateField}
      />
      <TimelineContent
        data={timelineData}
        selectedDateField={selectedDateField}
        fields={fields}
      />
    </div>
  );
}
