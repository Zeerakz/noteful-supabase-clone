
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
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  startDateField: DatabaseField | null;
  endDateField: DatabaseField | null;
  viewMode: TimelineViewMode;
}

export function useTimelineData({
  databaseId,
  fields,
  filterGroup,
  sortRules,
  startDateField,
  endDateField,
  viewMode
}: UseTimelineDataProps) {
  const { pages, loading, error, refetch } = useFilteredDatabasePages({
    databaseId,
    filterGroup,
    fields,
    sortRules
  });

  const timelineItems = useMemo(() => {
    if (!startDateField || !pages.length) return [];

    return pages
      .map(page => {
        const startDateValue = page.properties?.[startDateField.id];
        if (!startDateValue) return null;

        const startDate = new Date(startDateValue);
        if (isNaN(startDate.getTime())) return null;

        let endDate: Date | undefined;
        if (endDateField) {
          const endDateValue = page.properties?.[endDateField.id];
          if (endDateValue) {
            const parsedEndDate = new Date(endDateValue);
            if (!isNaN(parsedEndDate.getTime())) {
              endDate = parsedEndDate;
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
  }, [pages, startDateField, endDateField]);

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
    timelineItems,
    timelineRange,
    loading,
    error,
    refetch
  };
}
