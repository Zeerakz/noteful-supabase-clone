
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function SystemBadge({ className, size = 'sm' }: SystemBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1 bg-muted/50 text-muted-foreground border-muted-foreground/30',
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
        className
      )}
    >
      <Lock className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      System
    </Badge>
  );
}
