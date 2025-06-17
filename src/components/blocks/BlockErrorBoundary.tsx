
import React from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface BlockErrorBoundaryProps {
  children: React.ReactNode;
  blockId: string;
  blockType: string;
  onRetry?: () => void;
  onReportError?: (blockId: string, error: Error) => void;
}

export function BlockErrorBoundary({ 
  children, 
  blockId, 
  blockType, 
  onRetry,
  onReportError 
}: BlockErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: any) => {
    console.error(`Block rendering error for ${blockType} (${blockId}):`, error, errorInfo);
    onReportError?.(blockId, error);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      context={`block-${blockType}-${blockId}`}
    >
      {children}
    </ErrorBoundary>
  );
}
