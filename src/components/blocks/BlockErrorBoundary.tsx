
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

  const createErrorFallback = (error: Error, resetError: () => void) => (
    <div className="p-4 my-2 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Error rendering {blockType} block
          </h3>
          <p className="text-xs text-red-600 mb-3 break-words">
            {error.message}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resetError();
                onRetry?.();
              }}
              className="text-xs h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs text-red-500 cursor-pointer">
                Debug info
              </summary>
              <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap break-all">
                Block ID: {blockId}
                {'\n'}Error: {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={createErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}
