
import { useState, useEffect } from 'react';
import { DatabaseService } from '@/services/databaseService';
import { DatabaseField } from '@/types/database';
import { PageWithProperties, KanbanColumn } from '../types';

interface UseKanbanDataProps {
  databaseId: string;
}

export function useKanbanData({ databaseId }: UseKanbanDataProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [pages, setPages] = useState<PageWithProperties[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find the first select-type field for grouping
  const selectField = fields.find(field => field.type === 'select' || field.type === 'multi-select');

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

  // For now, we'll show a placeholder structure
  // In a full implementation, you'd fetch pages that belong to this database
  useEffect(() => {
    setLoading(false);
    // Mock data for demonstration - in real implementation, fetch from database
    setPages([]);
  }, [databaseId]);

  // Create columns based on select field options
  useEffect(() => {
    if (!selectField) {
      setColumns([]);
      return;
    }

    const options = selectField.settings?.options || [];
    const defaultColumns: KanbanColumn[] = options.map((option: string) => ({
      id: option.toLowerCase().replace(/\s+/g, '-'),
      title: option,
      pages: [],
    }));

    // Add "No Status" column for pages without a value
    defaultColumns.unshift({
      id: 'no-status',
      title: 'No Status',
      pages: [],
    });

    // Group pages by select field value and sort by position
    const groupedColumns = defaultColumns.map(column => ({
      ...column,
      pages: pages
        .filter(page => {
          const fieldValue = page.properties[selectField.id];
          if (column.id === 'no-status') {
            return !fieldValue || fieldValue.trim() === '';
          }
          return fieldValue === column.title;
        })
        .sort((a, b) => (a.pos || 0) - (b.pos || 0)),
    }));

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
