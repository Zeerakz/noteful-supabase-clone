
import React from 'react';
import { Toast, ToastDescription, ToastTitle } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { Info, AlertCircle, Check } from 'lucide-react';

interface GentleToastProps {
  type?: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  className?: string;
}

export function GentleToast({ 
  type = 'info', 
  title, 
  message, 
  suggestion,
  onRetry,
  className,
  ...toastProps 
}: GentleToastProps & Omit<React.ComponentProps<typeof Toast>, keyof GentleToastProps>) {
  
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/95 border-emerald-200/60 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800/40 dark:text-emerald-100';
      case 'warning':
        return 'bg-amber-50/95 border-amber-200/60 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800/40 dark:text-amber-100';
      case 'error':
        return 'bg-orange-50/95 border-orange-200/60 text-orange-900 dark:bg-orange-950/90 dark:border-orange-800/40 dark:text-orange-100';
      default:
        return 'bg-blue-50/95 border-blue-200/60 text-blue-900 dark:bg-blue-950/90 dark:border-blue-800/40 dark:text-blue-100';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <Toast 
      className={cn(
        "backdrop-blur-sm shadow-lg animate-gentle-slide-in",
        getToastStyles(),
        className
      )}
      {...toastProps}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 space-y-1">
          {title && (
            <ToastTitle className="text-sm font-medium">
              {title}
            </ToastTitle>
          )}
          
          <ToastDescription className="text-sm leading-relaxed">
            {message}
          </ToastDescription>
          
          {suggestion && (
            <ToastDescription className="text-xs opacity-75 leading-relaxed">
              {suggestion}
            </ToastDescription>
          )}
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium underline underline-offset-2 hover:no-underline transition-all duration-200 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </Toast>
  );
}
