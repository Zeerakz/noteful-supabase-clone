
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { VirtualizedTable } from './VirtualizedTable';
import { DatabaseTableHeader } from './DatabaseTableHeader';
import { NoFieldsEmptyState } from './DatabaseTableEmptyStates';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  id: string;
  title: string;
  workspace_id: string;
  database_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  parent_page_id: string | null;
  order_index: number;
  properties: Record<string, string>;
}

interface DatabaseTableViewContentProps {
  pagesWithProperties: PageWithProperties[];
  fields: DatabaseField[];
  pagesLoading: boolean;
  pagesError: string | null;
  onCreateRow: () => void;
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  onRefetch: () => void;
}

export function DatabaseTableViewContent({
  pagesWithProperties,
  fields,
  pagesLoading,
  pagesError,
  onCreateRow,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  onRefetch
}: DatabaseTableViewContentProps) {
  if (pagesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="border rounded-lg p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pagesError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pagesError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefetch}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DatabaseTableHeader onCreateRow={onCreateRow} />

      <VirtualizedTable
        pages={pagesWithProperties}
        fields={fields}
        onTitleUpdate={onTitleUpdate}
        onPropertyUpdate={onPropertyUpdate}
        onDeleteRow={onDeleteRow}
        isLoading={pagesLoading}
        maxHeight="600px"
      />

      {fields.length === 0 && <NoFieldsEmptyState />}
    </div>
  );
}
