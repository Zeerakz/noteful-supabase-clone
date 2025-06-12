
import React from 'react';
import { Button } from '@/components/ui/button';

interface ListErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ListErrorState({ error, onRetry }: ListErrorStateProps) {
  return (
    <div className="text-center py-8">
      <p className="text-destructive">{error}</p>
      <Button onClick={onRetry} className="mt-2">
        Retry
      </Button>
    </div>
  );
}
