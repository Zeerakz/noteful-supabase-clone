
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SelectFieldDisplay } from './SelectFieldDisplay';
import { DateFieldDisplay } from './DateFieldDisplay';
import { RelationFieldDisplay } from './RelationFieldDisplay';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface FieldDisplayProps {
  field: DatabaseField;
  value: string | null;
  pageId?: string;
  onValueChange?: (value: string) => void;
}

export function FieldDisplay({ field, value, pageId, onValueChange }: FieldDisplayProps) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (field.type) {
    case 'text':
    case 'number':
    case 'email':
    case 'phone':
      return <span>{value}</span>;

    case 'url':
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {value}
        </a>
      );

    case 'checkbox':
      return (
        <Checkbox
          checked={value === 'true'}
          disabled
        />
      );

    case 'select':
      return (
        <SelectFieldDisplay
          value={value}
          settings={field.settings}
        />
      );

    case 'multi_select':
      return (
        <SelectFieldDisplay
          value={value}
          settings={field.settings}
          multiSelect
        />
      );

    case 'date':
      return <DateFieldDisplay value={value} />;

    case 'relation':
      return (
        <RelationFieldDisplay
          value={value}
          settings={field.settings}
        />
      );

    case 'formula':
    case 'rollup':
      // For computed fields, show the computed value or fallback to static display
      if (pageId) {
        // This would be used in database views where pageId is available
        // For now, fallback to showing the value as text
        return <span className="text-muted-foreground italic">{value || 'Not calculated'}</span>;
      }
      return <span className="text-muted-foreground italic">{value || 'Not calculated'}</span>;

    default:
      return <span>{value}</span>;
  }
}
