
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { ListCard } from './ListCard';
import { ListEmptyState } from './ListEmptyState';
import { ListLoadingState } from './ListLoadingState';
import { ListErrorState } from './ListErrorState';

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
}

interface DatabaseListContentProps {
  pagesWithProperties: PageWithProperties[];
  fields: DatabaseField[];
  loading: boolean;
  error: string | null;
  onCreateEntry: () => void;
  onFieldEdit: (pageId: string, fieldId: string, value: string) => void;
  onTitleEdit: (pageId: string, title: string) => void;
  onRefetch: () => void;
}

export function DatabaseListContent({
  pagesWithProperties,
  fields,
  loading,
  error,
  onCreateEntry,
  onFieldEdit,
  onTitleEdit,
  onRefetch
}: DatabaseListContentProps) {
  const majorFields = fields.slice(0, 4);

  if (loading) {
    return <ListLoadingState />;
  }

  if (error) {
    return <ListErrorState error={error} onRetry={onRefetch} />;
  }

  if (pagesWithProperties.length === 0) {
    return <ListEmptyState onCreateEntry={onCreateEntry} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Database List View</h3>
        <Button size="sm" className="gap-2" onClick={onCreateEntry}>
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pagesWithProperties.map((page) => (
          <ListCard
            key={page.pageId}
            page={page}
            fields={majorFields}
            onFieldEdit={onFieldEdit}
            onTitleEdit={onTitleEdit}
          />
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No fields defined for this database.</p>
          <p className="text-sm">Add fields to start organizing your data.</p>
        </div>
      )}
    </div>
  );
}
