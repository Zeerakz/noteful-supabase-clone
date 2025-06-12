
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusDisplayProps {
  value: string | null;
}

const statusColors = {
  'planning': 'bg-blue-100 text-blue-800 border-blue-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'to-do': 'bg-gray-100 text-gray-800 border-gray-200',
  'todo': 'bg-gray-100 text-gray-800 border-gray-200',
  'ongoing': 'bg-purple-100 text-purple-800 border-purple-200',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
  'blocked': 'bg-red-100 text-red-800 border-red-200',
  'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'cancelled': 'bg-gray-100 text-gray-600 border-gray-200',
} as const;

export function StatusDisplay({ value }: StatusDisplayProps) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  const normalizedStatus = value.toLowerCase().replace(/\s+/g, '-');
  const colorClass = statusColors[normalizedStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-medium ${colorClass}`}
    >
      {value}
    </Badge>
  );
}
