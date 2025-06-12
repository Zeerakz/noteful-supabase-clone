
import { useState, useEffect } from 'react';
import { DatabaseService } from '@/services/databaseService';
import { DatabaseField } from '@/types/database';
import { PageWithProperties, KanbanColumn } from '../types';

interface UseKanbanDataProps {
  databaseId: string;
  selectedFieldId?: string;
}

export function useKanbanData({ databaseId, selectedFieldId }: UseKanbanDataProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [pages, setPages] = useState<PageWithProperties[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find the select field for grouping based on selectedFieldId
  const selectField = fields.find(field => 
    field.id === selectedFieldId && (field.type === 'select' || field.type === 'multi_select')
  );

  // Fetch database fields
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const { data, error } = await DatabaseService.fetchDatabaseFields(databaseId);
        if (error) throw new Error(error);
        setFields(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch fields');
      }
    };

    if (databaseId) {
      fetchFields();
    }
  }, [databaseId]);

  // Fetch database pages
  useEffect(() => {
    const fetchPages = async () => {
      if (!databaseId) return;
      
      try {
        const { data, error } = await DatabaseService.fetchDatabasePages(databaseId);
        if (error) throw new Error(error);
        
        // Transform the pages data to match our PageWithProperties format
        const transformedPages: PageWithProperties[] = (data || []).map(page => {
          const properties: Record<string, string> = {};
          (page.page_properties || []).forEach((prop: any) => {
            properties[prop.field_id] = prop.value || '';
          });
          
          return {
            pageId: page.id,
            title: page.title,
            properties,
            pos: page.pos || 0,
          };
        });
        
        setPages(transformedPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pages');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [databaseId]);

  // Create columns based on select field options
  useEffect(() => {
    if (!selectField) {
      setColumns([]);
      return;
    }

    const options = selectField.settings?.options || [];
    const defaultColumns: KanbanColumn[] = options.map((option: any) => ({
      id: typeof option === 'string' ? option.toLowerCase().replace(/\s+/g, '-') : option.id,
      title: typeof option === 'string' ? option : option.name,
      pages: [],
    }));

    // Add "No Status" column for pages without a value
    defaultColumns.unshift({
      id: 'no-status',
      title: 'No Status',
      pages: [],
    });

    // Group pages by select field value and sort by position
    const groupedColumns = defaultColumns.map(column => {
      const columnPages = pages.filter(page => {
        const fieldValue = page.properties[selectField.id];
        
        if (column.id === 'no-status') {
          return !fieldValue || fieldValue.trim() === '';
        }
        
        // Handle both string options and object options
        if (selectField.type === 'multi_select') {
          // For multi-select, check if the option is in the comma-separated values
          const selectedValues = fieldValue ? fieldValue.split(',') : [];
          return selectedValues.some(value => {
            const optionId = typeof options[0] === 'string' ? column.title : column.title;
            return value.trim() === optionId;
          });
        } else {
          // For single select, direct comparison
          const optionValue = typeof options[0] === 'string' ? column.title : column.title;
          return fieldValue === optionValue;
        }
      }).sort((a, b) => (a.pos || 0) - (b.pos || 0));

      return {
        ...column,
        pages: columnPages,
      };
    });

    setColumns(groupedColumns);
  }, [selectField, pages]);

  return {
    fields,
    pages,
    columns,
    loading,
    error,
    selectField,
    setColumns,
    setPages
  };
}
