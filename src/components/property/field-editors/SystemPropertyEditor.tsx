
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SystemPropertyDisplay } from '../field-displays/SystemPropertyDisplay';
import { isSystemProperty } from '@/types/systemProperties';

interface SystemPropertyEditorProps {
  field: DatabaseField;
  value: string;
  onChange: (value: string) => void;
  workspaceId: string;
  pageId: string;
  pageData?: any;
  userProfiles?: any[];
}

export function SystemPropertyEditor({
  field,
  value,
  onChange,
  workspaceId,
  pageId,
  pageData,
  userProfiles
}: SystemPropertyEditorProps) {
  if (!isSystemProperty(field.type)) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 border rounded"
      />
    );
  }

  // System properties are read-only, so just display them
  return (
    <div className="px-2 py-1 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/30">
      <SystemPropertyDisplay
        field={field}
        value={value}
        pageId={pageId}
        pageData={pageData}
        userProfiles={userProfiles}
      />
    </div>
  );
}
