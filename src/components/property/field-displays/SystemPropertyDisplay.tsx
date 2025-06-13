
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SystemBadge } from '@/components/ui/system-badge';
import { getSystemPropertyValue, isSystemProperty } from '@/types/systemProperties';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Hash } from 'lucide-react';

interface SystemPropertyDisplayProps {
  field: DatabaseField;
  value: string | null;
  pageId?: string;
  pageData?: any;
  userProfiles?: any[];
}

export function SystemPropertyDisplay({
  field,
  value,
  pageId,
  pageData,
  userProfiles = []
}: SystemPropertyDisplayProps) {
  if (!isSystemProperty(field.type)) {
    return <span className="text-foreground">{value || '—'}</span>;
  }

  const systemValue = pageData ? getSystemPropertyValue(field.type, pageData, userProfiles) : (value || '—');

  const getIcon = () => {
    switch (field.type) {
      case 'created_time':
      case 'last_edited_time':
        return <Calendar className="h-3 w-3" />;
      case 'created_by':
      case 'last_edited_by':
        return <User className="h-3 w-3" />;
      case 'id':
        return <Hash className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatValue = () => {
    if (field.type === 'id' && systemValue) {
      // Show only first 8 characters of ID for readability
      return systemValue.substring(0, 8) + '...';
    }
    return systemValue;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {getIcon()}
        <span className="text-sm">{formatValue()}</span>
      </div>
      <SystemBadge size="sm" />
    </div>
  );
}
