
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface GentleToastProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  className?: string;
}

export function GentleToast({ type, title, message, suggestion, onRetry, className }: GentleToastProps) {
  const styles = {
    success: {
      icon: CheckCircle,
      bar: 'bg-green-500',
      text: 'text-green-800 dark:text-green-200',
    },
    warning: {
      icon: AlertTriangle,
      bar: 'bg-amber-500',
      text: 'text-amber-800 dark:text-amber-200',
    },
    error: {
      icon: XCircle,
      bar: 'bg-red-500',
      text: 'text-red-800 dark:text-red-200',
    },
    info: {
      icon: Info,
      bar: 'bg-blue-500',
      text: 'text-blue-800 dark:text-blue-200',
    },
  };

  const selectedStyle = styles[type];
  const Icon = selectedStyle.icon;

  return (
    <div
      className={cn(
        'flex items-start w-full max-w-sm p-4 space-x-3 bg-background border border-border rounded-lg shadow-lg pointer-events-auto',
        className
      )}
    >
      <div className={cn("flex-shrink-0 w-1 h-full rounded-full", selectedStyle.bar)}></div>
      <div className="flex-shrink-0 pt-0.5">
        <Icon className={cn("w-5 h-5", selectedStyle.text)} />
      </div>
      <div className="flex-1 space-y-1">
        {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
        <p className="text-sm text-muted-foreground">{message}</p>
        {suggestion && <p className="text-xs text-muted-foreground/80">{suggestion}</p>}
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="mt-2 text-xs h-auto py-1 px-2"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

