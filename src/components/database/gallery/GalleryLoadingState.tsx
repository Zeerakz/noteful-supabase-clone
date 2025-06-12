
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { GalleryCardSize } from './types';

interface GalleryLoadingStateProps {
  cardSize: GalleryCardSize;
}

export function GalleryLoadingState({ cardSize }: GalleryLoadingStateProps) {
  const getGridColumns = () => {
    switch (cardSize) {
      case 'small':
        return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6';
      case 'medium':
        return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4';
      case 'large':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  return (
    <div className="space-y-4">
      <div className={cn("grid gap-4", getGridColumns())}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    </div>
  );
}
