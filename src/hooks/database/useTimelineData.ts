
import { useState, useEffect, useMemo } from 'react';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { TimelineItem, TimelineViewMode } from '@/components/database/timeline/types';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface UseTimelineDataProps {
  databaseId: string;
  fields: DatabaseField[];
  pages: any[];
}

export function useTimelineData({
  databaseId,
  fields,
  pages
}: UseTimelineDataProps) {
  const [selectedDateField, setSelectedDateField] = useState<DatabaseField | null>(null);
  const [selectedStartField, setSelectedStartField] = useState<DatabaseField | null>(null);
  const [selectedEndField, setSelectedEndField] = useState<DatabaseField | null>(null);
  const [viewMode, setViewMode] = useState<TimelineViewMode>('month');

  // Auto-select first date field if none selected
  useEffect(() => {
    if (fields.length > 0 && !selectedDateField) {
      const firstDateField = fields.find(field => field.type === 'date' || field.type === 'datetime');
      if (firstDateField) {
        setSelectedDateField(firstDateField);
        setSelectedStartField(firstDateField);
      }
    }
  }, [fields, selectedDateField]);

  const timelineItems = useMemo(() => {
    if (!selectedStartField || !pages.length) return [];

    return pages
      .map(page => {
        const startDateValue = page.properties?.[selectedStartField.id];
        if (!startDateValue) return null;

        // Handle both date and timestamp field types
        let startDate: Date;
        try {
          if (typeof startDateValue === 'string') {
            startDate = new Date(startDateValue);
          } else {
            startDate = new Date(startDateValue);
          }
          
          if (isNaN(startDate.getTime())) return null;
        } catch {
          return null;
        }

        let endDate: Date | undefined;
        if (selectedEndField) {
          const endDateValue = page.properties?.[selectedEndField.id];
          if (endDateValue) {
            try {
              const parsedEndDate = new Date(endDateValue);
              if (!isNaN(parsedEndDate.getTime())) {
                endDate = parsedEndDate;
              }
            } catch {
              // Invalid end date, continue without it
            }
          }
        }

        return {
          id: page.id,
          title: page.title,
          startDate,
          endDate,
          properties: page.properties,
          pageId: page.id
        } as TimelineItem;
      })
      .filter(Boolean) as TimelineItem[];
  }, [pages, selectedStartField, selectedEndField]);

  const timelineRange = useMemo(() => {
    if (!timelineItems.length) {
      const now = new Date();
      return {
        startDate: subDays(now, 30),
        endDate: addDays(now, 30)
      };
    }

    const allDates = timelineItems.flatMap(item => [
      item.startDate,
      ...(item.endDate ? [item.endDate] : [])
    ]);

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Extend range based on view mode
    let startDate: Date, endDate: Date;
    
    switch (viewMode) {
      case 'month':
        startDate = startOfMonth(subDays(minDate, 30));
        endDate = endOfMonth(addDays(maxDate, 30));
        break;
      case 'week':
        startDate = startOfWeek(subDays(minDate, 14));
        endDate = endOfWeek(addDays(maxDate, 14));
        break;
      case 'day':
      default:
        startDate = subDays(minDate, 7);
        endDate = addDays(maxDate, 7);
        break;
    }

    return { startDate, endDate };
  }, [timelineItems, viewMode]);

  return {
    selectedDateField,
    selectedStartField,
    selectedEndField,
    viewMode,
    timelineItems,
    timelineRange,
    setSelectedDateField,
    setSelectedStartField,
    setSelectedEndField,
    setViewMode
  };
}
