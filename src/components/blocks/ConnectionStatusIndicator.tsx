
import React from 'react';
import { Wifi, WifiOff, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/hooks/useStableSubscription';

interface ConnectionStatusIndicatorProps {
  connectionStatus: ConnectionStatus;
  onReconnect?: () => void;
}

export function ConnectionStatusIndicator({ 
  connectionStatus, 
  onReconnect 
}: ConnectionStatusIndicatorProps) {
  // Only show indicator when there are connection issues
  if (connectionStatus.isConnected && !connectionStatus.isRetrying) {
    return null;
  }

  const getStatusColor = () => {
    if (connectionStatus.isRetrying) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (!connectionStatus.isConnected) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (connectionStatus.isRetrying) return <RotateCcw className="h-3 w-3 animate-spin" />;
    if (!connectionStatus.isConnected) {
      if (connectionStatus.retryCount >= 3) {
        return <AlertTriangle className="h-3 w-3" />;
      }
      return <WifiOff className="h-3 w-3" />;
    }
    return <Wifi className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (connectionStatus.isRetrying) {
      return `Reconnecting... (${connectionStatus.retryCount}/3)`;
    }
    if (!connectionStatus.isConnected) {
      if (connectionStatus.retryCount >= 3) {
        return 'Connection failed';
      }
      return 'Connection lost';
    }
    return 'Connected';
  };

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-md border text-xs ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {!connectionStatus.isConnected && !connectionStatus.isRetrying && onReconnect && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-current/10"
          onClick={onReconnect}
          title="Reconnect"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
