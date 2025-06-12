
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SelectFieldDisplay } from './SelectFieldDisplay';
import { DateFieldDisplay } from './DateFieldDisplay';
import { RelationFieldDisplay } from './RelationFieldDisplay';
import { ComputedFieldDisplay } from './ComputedFieldDisplay';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface FieldDisplayProps {
  field: DatabaseField;
  value: string | null;
}

export function FieldDisplay({ field, value }: FieldDisplayProps) {
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
      return (
        <ComputedFieldDisplay
          field={field}
          value={value}
        />
      );

    default:
      return <span>{value}</span>;
  }
}
