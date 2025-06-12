
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SelectFieldDisplay } from './SelectFieldDisplay';
import { DateFieldDisplay } from './DateFieldDisplay';
import { RelationFieldDisplay } from './RelationFieldDisplay';
import { StatusDisplay } from './StatusDisplay';
import { TeamMembersDisplay } from './TeamMembersDisplay';
import { PlatformDisplay } from './PlatformDisplay';
import { LinkDisplay } from './LinkDisplay';
import { Checkbox } from '@/components/ui/checkbox';

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

  // Check field name patterns for intelligent rendering
  const fieldNameLower = field.name.toLowerCase();
  
  // Status fields
  if (fieldNameLower.includes('status') || fieldNameLower.includes('state')) {
    return <StatusDisplay value={value} />;
  }
  
  // Team/People fields
  if (fieldNameLower.includes('team') || fieldNameLower.includes('member') || 
      fieldNameLower.includes('assign') || fieldNameLower.includes('people') ||
      fieldNameLower.includes('user') || fieldNameLower.includes('owner')) {
    return <TeamMembersDisplay value={value} />;
  }
  
  // Platform fields
  if (fieldNameLower.includes('platform') || fieldNameLower.includes('channel') ||
      fieldNameLower.includes('social') || fieldNameLower.includes('medium')) {
    return <PlatformDisplay value={value} />;
  }
  
  // Link/URL fields
  if (fieldNameLower.includes('link') || fieldNameLower.includes('url') ||
      fieldNameLower.includes('website') || fieldNameLower.includes('ref')) {
    return <LinkDisplay value={value} />;
  }

  // Standard field type rendering
  switch (field.type) {
    case 'text':
    case 'number':
    case 'email':
    case 'phone':
      return <span>{value}</span>;

    case 'url':
      return <LinkDisplay value={value} />;

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
