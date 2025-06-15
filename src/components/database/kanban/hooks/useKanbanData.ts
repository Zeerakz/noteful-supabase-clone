import { useState, useEffect } from 'react';
import { DatabaseFieldService } from '@/services/database/databaseFieldService';
import { DatabaseQueryService } from '@/services/database/databaseQueryService';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { PageWithProperties, KanbanColumn } from '../types';

interface UseKanbanDataProps {
  databaseId: string;
  selectedField: DatabaseField | null;
  filterGroup?: FilterGroup;
  sortRules?: SortRule[];
}

export function useKanbanData({ 
  databaseId, 
  selectedField, 
  filterGroup, 
  sortRules 
}: UseKanbanDataProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [pages, setPages] = useState<PageWithProperties[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!databaseId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch fields first.
        const { data: fetchedFields, error: fieldsError } = await DatabaseFieldService.fetchDatabaseFields(databaseId);
        if (fieldsError) throw new Error(fieldsError.message);
        
        const currentFields = (fetchedFields as DatabaseField[] || []);
        setFields(currentFields);

        // 2. Then fetch pages using the fields.
        const { data: pagesData, error: pagesError } = await DatabaseQueryService.fetchDatabasePages(
          databaseId,
          filterGroup,
          currentFields,
          sortRules
        );
        
        if (pagesError) throw new Error(pagesError.message);
        
        // 3. Transform pages.
        const transformedPages: PageWithProperties[] = (pagesData || []).map((page: any) => {
          const properties: Record<string, string> = {};
          (page.property_values || []).forEach((prop: { property_id: string; value: string; }) => {
            properties[prop.property_id] = prop.value || '';
          });
          return {
            pageId: page.id,
            title: page.properties?.title || 'Untitled',
            properties,
            pos: page.pos || 0,
          };
        });
        
        setPages(transformedPages);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [databaseId, filterGroup, sortRules]);

  // Create columns based on selected field options
  useEffect(() => {
    if (!selectedField) {
      setColumns([]);
      return;
    }

    let options: Array<{ id: string; name: string; color?: string }> = [];

    if (selectedField.type === 'status') {
      // For status fields, flatten options from all groups to preserve order
      const groups = selectedField.settings?.groups || [];
      options = groups.flatMap((group: any) => group.options || []);
    } else if (['select', 'multi_select'].includes(selectedField.type)) {
      options = selectedField.settings?.options || [];
    }

    const defaultColumns: KanbanColumn[] = options.map((option: any) => ({
      id: option.id,
      title: option.name,
      color: option.color,
      pages: [],
    }));

    // Add "No Status" column for pages without a value
    const finalColumns = [
      {
        id: 'no-status',
        title: 'No Status',
        pages: [],
      },
      ...defaultColumns,
    ];

    // Group pages by selected field value and sort by position
    const groupedColumns = finalColumns.map(column => ({
      ...column,
      pages: pages
        .filter(page => {
          const fieldValue = page.properties[selectedField.id];
          if (column.id === 'no-status') {
            return !fieldValue || fieldValue.trim() === '' || fieldValue === '[]';
          }
          
          if (selectedField.type === 'multi_select') {
            try {
              const values = JSON.parse(fieldValue || '[]');
              return Array.isArray(values) && values.includes(column.id);
            } catch (e) {
              return fieldValue === column.id;
            }
          }

          // The stored value is the option ID.
          return fieldValue === column.id;
        })
        .sort((a, b) => (a.pos || 0) - (b.pos || 0)),
    }));

    setColumns(groupedColumns);
  }, [selectedField, pages]);

  return {
    fields,
    pages,
    columns,
    loading,
    error,
    setColumns,
    setPages
  };
}
