
import React from 'react';
import { Block } from '@/types/block';

interface OptimisticBlockWrapperProps {
  block: Block;
  children: React.ReactNode;
  hasOptimisticChanges?: boolean;
}

export function OptimisticBlockWrapper({ block, children, hasOptimisticChanges = false }: OptimisticBlockWrapperProps) {
  const isOptimistic = block.id.startsWith('temp-');
  
  return (
    <div
      className={`transition-all duration-200 ${
        isOptimistic 
          ? 'opacity-70 transform scale-[0.99] bg-blue-50/20 rounded-lg border border-blue-200/30' 
          : hasOptimisticChanges
          ? 'opacity-95 bg-yellow-50/20 rounded-lg border border-yellow-200/30'
          : 'opacity-100'
      }`}
    >
      {children}
      {isOptimistic && (
        <div className="absolute top-1 right-1 text-xs text-blue-600 bg-blue-100 px-1 rounded">
          Creating...
        </div>
      )}
    </div>
  );
}
