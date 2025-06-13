
import React from 'react';

interface DatabaseViewErrorProps {
  error: string;
  message?: string;
}

export function DatabaseViewError({ error, message }: DatabaseViewErrorProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-destructive mb-2">{message || "Error loading database"}</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    </div>
  );
}
