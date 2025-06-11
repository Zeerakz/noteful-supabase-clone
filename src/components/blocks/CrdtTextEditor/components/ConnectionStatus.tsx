
import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isEditMode: boolean;
  isFocused: boolean;
}

export function ConnectionStatus({ isConnected, isEditMode, isFocused }: ConnectionStatusProps) {
  if (!isEditMode || !isFocused) return null;

  return (
    <div className="absolute top-1 right-1 flex items-center gap-1">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
        title={isConnected ? 'Connected (CRDT enabled)' : 'Disconnected'}
      />
      <span className="text-xs text-muted-foreground">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}
