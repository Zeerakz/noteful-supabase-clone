
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusDisplayProps {
  value: string | null;
  options?: Array<{ id: string; name: string; color?: string }>;
}

const DEFAULT_STATUS_COLORS = {
  'planning': '#3b82f6',
  'completed': '#22c55e', 
  'to-do': '#64748b',
  'todo': '#64748b',
  'ongoing': '#8b5cf6',
  'in-progress': '#8b5cf6',
  'blocked': '#ef4444',
  'on-hold': '#eab308',
  'cancelled': '#64748b',
} as const;

export function StatusDisplay({ value, options }: StatusDisplayProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  // First, try to find the option in the provided options array
  const matchedOption = options?.find(opt => opt.id === value || opt.name === value);
  
  let color: string | undefined;
  let displayName = value;
  
  if (matchedOption) {
    color = matchedOption.color;
    displayName = matchedOption.name;
  } else {
    // Fallback to default color mapping
    const normalizedStatus = value.toLowerCase().replace(/\s+/g, '-');
    color = DEFAULT_STATUS_COLORS[normalizedStatus as keyof typeof DEFAULT_STATUS_COLORS];
  }

  return (
    <Badge 
      variant="outline" 
      className="text-xs font-medium border-border/50"
      style={{ 
        backgroundColor: color ? `${color}20` : undefined,
        borderColor: color || undefined,
        color: color || undefined
      }}
    >
      {displayName}
    </Badge>
  );
}
