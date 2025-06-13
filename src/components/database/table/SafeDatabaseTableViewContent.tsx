
import React from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { DatabaseTableViewContent } from './DatabaseTableViewContent';
import { errorHandler } from '@/utils/errorHandler';

interface SafeDatabaseTableViewContentProps {
  [key: string]: any;
}

export function SafeDatabaseTableViewContent(props: SafeDatabaseTableViewContentProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorHandler.logError(error, {
          context: 'database_table_view',
          props: {
            databaseId: props.databaseId,
            pagesCount: props.pagesWithProperties?.length || 0,
            fieldsCount: props.fields?.length || 0,
          },
          componentStack: errorInfo.componentStack
        });
      }}
      fallback={
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-foreground">Table View Error</h3>
            <p className="text-muted-foreground">
              There was an error loading the table view. Please try refreshing the page.
            </p>
          </div>
        </div>
      }
    >
      <DatabaseTableViewContent {...props} />
    </ErrorBoundary>
  );
}
