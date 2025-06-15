
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

  // Fetch database fields
  useEffect(() => {
    const fetchFields = async () => {
      if (!databaseId) return;
      
      try {
        const { data, error } = await DatabaseFieldService.fetchDatabaseFields(databaseId);
        if (error) throw new Error(error.message);
        setFields(data as DatabaseField[] || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch fields');
      }
    };

    fetchFields();
  }, [databaseId]);

  // Fetch pages with properties
  useEffect(() => {
    const fetchPages = async () => {
      if (!databaseId) return;
      
      setLoading(true);
      try {
        const { data, error } = await DatabaseQueryService.fetchDatabasePages(
          databaseId,
          filterGroup,
          fields,
          sortRules
        );
        
        if (error) throw new Error(error);
        
        // Transform pages to include properties in the expected format
        const transformedPages: PageWithProperties[] = (data || []).map((page: any) => {
          const properties: Record<string, string> = {};
          
          // Convert page_properties array to a properties object
          (page.page_properties || []).forEach((prop: any) => {
            properties[prop.field_id] = prop.value || '';
          });
          
          return {
            pageId: page.id,
            title: page.title || 'Untitled',
            properties,
            pos: page.order_index || 0,
          };
        });
        
        setPages(transformedPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pages');
      } finally {
        setLoading(false);
      }
    };

    if (fields.length > 0) {
      fetchPages();
    }
  }, [databaseId, fields, filterGroup, sortRules]);

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
