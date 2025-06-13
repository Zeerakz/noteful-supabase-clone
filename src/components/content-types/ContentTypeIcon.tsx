
import React from 'react';
import { ContentType, ContentTypeUtils } from '@/types/contentTypes';
import { cn } from '@/lib/utils';

interface ContentTypeIconProps {
  contentType: ContentType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

/**
 * ContentTypeIcon component for displaying content type icons
 * 
 * Guidelines:
 * - Only use for first-level navigation items
 * - Maintain consistent sizing across the application
 * - Use semantic colors based on content type
 */
export function ContentTypeIcon({ 
  contentType, 
  size = 'md', 
  className,
  showTooltip = true 
}: ContentTypeIconProps) {
  const IconComponent = ContentTypeUtils.getIcon(contentType);
  const label = ContentTypeUtils.getLabel(contentType);
  const color = ContentTypeUtils.getColor(contentType);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    pink: 'text-pink-600',
    indigo: 'text-indigo-600',
    teal: 'text-teal-600',
    cyan: 'text-cyan-600',
    gray: 'text-gray-600'
  };

  return (
    <IconComponent
      className={cn(
        sizeClasses[size],
        colorClasses[color as keyof typeof colorClasses] || colorClasses.gray,
        className
      )}
      title={showTooltip ? label : undefined}
      aria-label={label}
    />
  );
}
