
import { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useFilteredDatabasePagesQuery } from '@/hooks/useFilteredDatabasePagesQuery';
import { format, parseISO, isValid } from 'date-fns';

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
  dateValue?: Date;
}

interface UseCalendarDataProps {
  databaseId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
}

export function useCalendarData({ databaseId, filterGroup, fields, sortRules }: UseCalendarDataProps) {
  const { pages, loading, error } = useFilteredDatabasePagesQuery({
    databaseId,
    filterGroup,
    fields,
    sortRules,
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateField, setSelectedDateField] = useState<DatabaseField | null>(null);

  // Find all date-type fields (including timestamp fields)
  const dateFields = fields.filter(field => 
    field.type === 'date' || field.type === 'datetime'
  );

  // Set default date field (first one found)
  useEffect(() => {
    if (dateFields.length > 0 && !selectedDateField) {
      setSelectedDateField(dateFields[0]);
    } else if (dateFields.length === 0) {
      setSelectedDateField(null);
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
          // Handle both ISO date strings and timestamp values
          let parsedDate: Date;
          
          if (typeof prop.value === 'string') {
            // Try parsing as ISO string first
            parsedDate = parseISO(prop.value);
            
            // If not valid, try creating a new Date object
            if (!isValid(parsedDate)) {
              parsedDate = new Date(prop.value);
            }
          } else {
            // Handle timestamp or other date formats
            parsedDate = new Date(prop.value);
          }
          
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

  // Add validation for date fields
  const hasDateFields = dateFields.length > 0;
  const hasValidDateField = selectedDateField !== null;

  return {
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
  };
}
