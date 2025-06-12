
import React from 'react';

export function NoFieldsEmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>No fields defined for this database.</p>
      <p className="text-sm">Add fields to start organizing your data.</p>
    </div>
  );
}
