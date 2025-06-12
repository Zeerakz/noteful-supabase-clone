
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusDisplayProps {
  value: string | null;
}

const statusColors = {
  'planning': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  'completed': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  'to-do': 'bg-muted text-muted-foreground border-border',
  'todo': 'bg-muted text-muted-foreground border-border',
  'ongoing': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  'blocked': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  'cancelled': 'bg-muted text-muted-foreground border-border',
} as const;

export function StatusDisplay({ value }: StatusDisplayProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const normalizedStatus = value.toLowerCase().replace(/\s+/g, '-');
  const colorClass = statusColors[normalizedStatus as keyof typeof statusColors] || 'bg-muted text-muted-foreground border-border';

  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-medium ${colorClass}`}
    >
      {value}
    </Badge>
  );
}
