
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PlatformDisplayProps {
  value: string | null;
}

const platformColors = {
  'twitter': 'bg-blue-50 text-blue-700 border-blue-200',
  'discord': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'youtube': 'bg-red-50 text-red-700 border-red-200',
  'linkedin': 'bg-blue-50 text-blue-700 border-blue-200',
  'facebook': 'bg-blue-50 text-blue-700 border-blue-200',
  'instagram': 'bg-pink-50 text-pink-700 border-pink-200',
  'tiktok': 'bg-gray-50 text-gray-700 border-gray-200',
  'github': 'bg-gray-50 text-gray-700 border-gray-200',
  'slack': 'bg-green-50 text-green-700 border-green-200',
  'web': 'bg-purple-50 text-purple-700 border-purple-200',
  'mobile': 'bg-orange-50 text-orange-700 border-orange-200',
} as const;

export function PlatformDisplay({ value }: PlatformDisplayProps) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  const normalizedPlatform = value.toLowerCase().replace(/\s+/g, '');
  const colorClass = platformColors[normalizedPlatform as keyof typeof platformColors] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-medium ${colorClass}`}
    >
      {value}
    </Badge>
  );
}
