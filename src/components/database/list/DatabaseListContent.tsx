
import React from 'react';
import { DatabaseField } from '@/types/database';
import { ListCard } from './ListCard';
import { ListLoadingState } from './ListLoadingState';
import { ListErrorState } from './ListErrorState';
import { ListEmptyState } from './ListEmptyState';

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
  onRefetch,
}: DatabaseListContentProps) {
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
    <div className="p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pagesWithProperties.map((page) => (
          <ListCard
            key={page.pageId}
            page={page}
            fields={fields}
            onFieldEdit={onFieldEdit}
            onTitleEdit={onTitleEdit}
          />
        ))}
      </div>
    </div>
  );
}
