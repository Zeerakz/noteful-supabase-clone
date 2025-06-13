
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function DatabaseViewLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
