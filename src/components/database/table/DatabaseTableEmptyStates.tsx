
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

export const DatabaseTableEmptyStates = {
  Loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading database entries...</span>
      </div>
    </div>
  ),

  Error: ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">Error loading data</span>
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error}
      </p>
      <Button variant="outline" onClick={onRetry} size="sm">
        Try Again
      </Button>
    </div>
  ),

  Empty: ({ onCreateRow }: { onCreateRow: () => void }) => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="p-3 rounded-full bg-muted">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h3 className="font-medium text-foreground mb-1">No entries yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get started by creating your first database entry.
        </p>
        <Button onClick={onCreateRow} size="sm">
          Add Row
        </Button>
      </div>
    </div>
  )
};

export function NoFieldsEmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>No fields defined for this database.</p>
      <p className="text-sm">Add fields to start organizing your data.</p>
    </div>
  );
}
