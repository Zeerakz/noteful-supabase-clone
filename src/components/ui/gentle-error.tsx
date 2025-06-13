
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Info } from 'lucide-react';

interface GentleErrorProps {
  message: string;
  suggestion?: string;
  type?: 'validation' | 'save' | 'network' | 'permission';
  className?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  field?: string;
}

export function GentleError({ 
  message, 
  suggestion, 
  type = 'validation',
  className,
  onRetry,
  onDismiss,
  field
}: GentleErrorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => {
    // Gentle entrance animation
    setIsVisible(true);
    
    // Subtle shake for attention
    const shakeTimer = setTimeout(() => {
      setShouldShake(true);
      const resetShake = setTimeout(() => setShouldShake(false), 400);
      return () => clearTimeout(resetShake);
    }, 100);

    return () => clearTimeout(shakeTimer);
  }, []);

  const getErrorStyles = () => {
    switch (type) {
      case 'validation':
        return 'bg-amber-50/80 border-amber-200/60 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-200';
      case 'save':
        return 'bg-orange-50/80 border-orange-200/60 text-orange-900 dark:bg-orange-950/20 dark:border-orange-800/40 dark:text-orange-200';
      case 'network':
        return 'bg-blue-50/80 border-blue-200/60 text-blue-900 dark:bg-blue-950/20 dark:border-blue-800/40 dark:text-blue-200';
      case 'permission':
        return 'bg-purple-50/80 border-purple-200/60 text-purple-900 dark:bg-purple-950/20 dark:border-purple-800/40 dark:text-purple-200';
      default:
        return 'bg-amber-50/80 border-amber-200/60 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-200';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'validation':
        return 'text-amber-600 dark:text-amber-400';
      case 'save':
        return 'text-orange-600 dark:text-orange-400';
      case 'network':
        return 'text-blue-600 dark:text-blue-400';
      case 'permission':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-amber-600 dark:text-amber-400';
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 transition-all duration-300 ease-out",
        "shadow-sm backdrop-blur-sm",
        getErrorStyles(),
        shouldShake && "animate-gentle-shake",
        isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1",
        className
      )}
      role="alert"
      aria-live="polite"
      aria-describedby={field ? `${field}-error` : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", getIconColor())}>
          <Info className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
          
          {suggestion && (
            <p className="text-xs opacity-80 leading-relaxed">
              {suggestion}
            </p>
          )}
          
          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-2 pt-1">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs font-medium underline underline-offset-2 hover:no-underline transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm px-1"
                >
                  Try again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs opacity-60 hover:opacity-80 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm px-1"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Field wrapper component for inline validation
interface GentleFieldErrorProps {
  children: React.ReactNode;
  error?: string;
  suggestion?: string;
  fieldName?: string;
  className?: string;
}

export function GentleFieldError({ 
  children, 
  error, 
  suggestion, 
  fieldName,
  className 
}: GentleFieldErrorProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (error && !hasError) {
      setHasError(true);
      // Reset error state after animation
      const timer = setTimeout(() => setHasError(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [error, hasError]);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "transition-all duration-300 ease-out rounded-md",
          error && "animate-gentle-glow",
          hasError && "animate-gentle-shake"
        )}
        style={{
          boxShadow: error 
            ? '0 0 0 1px hsl(var(--amber-500) / 0.3), 0 0 8px hsl(var(--amber-500) / 0.1)' 
            : undefined
        }}
      >
        {children}
      </div>
      
      {error && (
        <GentleError
          message={error}
          suggestion={suggestion}
          type="validation"
          field={fieldName}
        />
      )}
    </div>
  );
}
