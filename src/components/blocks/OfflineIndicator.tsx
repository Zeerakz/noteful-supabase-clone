
import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfflineMutations } from '@/hooks/blocks/useOfflineMutations';

interface OfflineIndicatorProps {
  workspaceId: string;
  pageId: string;
}

export function OfflineIndicator({ workspaceId, pageId }: OfflineIndicatorProps) {
  const { 
    isOnline, 
    pendingMutations, 
    processPendingMutations,
    clearPendingMutations 
  } = useOfflineMutations(workspaceId, pageId);

  const handleSync = () => {
    if (isOnline && pendingMutations > 0) {
      processPendingMutations();
    }
  };

  const handleClearPending = () => {
    clearPendingMutations();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>

      {/* Pending Mutations Indicator */}
      {pendingMutations > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <CloudOff className="h-3 w-3" />
            {pendingMutations} pending
          </Badge>
          
          {isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              className="h-6 px-2 text-xs"
            >
              <Cloud className="h-3 w-3 mr-1" />
              Sync
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearPending}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
