
import { useState, useEffect } from 'react';
import { DatabaseService } from '@/services/databaseService';
import { DatabaseField } from '@/types/database';
import { PageWithProperties, KanbanColumn } from '../types';

interface UseKanbanDataProps {
  databaseId: string;
  selectedField: DatabaseField | null;
}

export function useKanbanData({ databaseId, selectedField }: UseKanbanDataProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [pages, setPages] = useState<PageWithProperties[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Create columns based on selected field options
  useEffect(() => {
    if (!selectedField) {
      setColumns([]);
      return;
    }

    const options = selectedField.settings?.options || [];
    const defaultColumns: KanbanColumn[] = options.map((option: any) => ({
      id: typeof option === 'string' 
        ? option.toLowerCase().replace(/\s+/g, '-')
        : option.id || option.name?.toLowerCase().replace(/\s+/g, '-'),
      title: typeof option === 'string' ? option : option.name || option.id,
      pages: [],
    }));

    // Add "No Status" column for pages without a value
    defaultColumns.unshift({
      id: 'no-status',
      title: 'No Status',
      pages: [],
    });

    // Group pages by selected field value and sort by position
    const groupedColumns = defaultColumns.map(column => ({
      ...column,
      pages: pages
        .filter(page => {
          const fieldValue = page.properties[selectedField.id];
          if (column.id === 'no-status') {
            return !fieldValue || fieldValue.trim() === '';
          }
          return fieldValue === column.title;
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
