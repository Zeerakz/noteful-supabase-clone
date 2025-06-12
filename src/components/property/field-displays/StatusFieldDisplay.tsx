
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusPropertyConfig } from '@/types/property';

interface StatusFieldDisplayProps {
  value: any;
  config: StatusPropertyConfig;
  field?: any;
  pageId?: string;
}

export function StatusFieldDisplay({ value, config }: StatusFieldDisplayProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  // Find the option across all groups
  const allOptions = config.groups?.flatMap(group => group.options || []) || [];
  const option = allOptions.find(opt => opt.id === value);
  
  if (!option) {
    return <span className="text-muted-foreground">{value}</span>;
  }

  // Find the group for styling context
  const group = config.groups?.find(g => g.id === option.groupId);

  return (
    <Badge 
      variant="outline" 
      className="text-xs font-medium border-border/50"
      style={{ 
        backgroundColor: option.color ? `${option.color}20` : undefined,
        borderColor: option.color || undefined,
        color: option.color || undefined
      }}
    >
      {option.name}
    </Badge>
  );
}
