
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PlatformDisplayProps {
  value: string | null;
}

const platformColors = {
  'twitter': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  'discord': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  'youtube': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  'linkedin': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  'facebook': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  'instagram': 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
  'tiktok': 'bg-muted text-muted-foreground border-border',
  'github': 'bg-muted text-muted-foreground border-border',
  'slack': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  'web': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  'mobile': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
} as const;

export function PlatformDisplay({ value }: PlatformDisplayProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const normalizedPlatform = value.toLowerCase().replace(/\s+/g, '');
  const colorClass = platformColors[normalizedPlatform as keyof typeof platformColors] || 'bg-muted text-muted-foreground border-border';

  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-medium ${colorClass}`}
    >
      {value}
    </Badge>
  );
}
