
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

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

  useEffect(() => {
    // Gentle entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
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
      case 'validation': return 'text-amber-600 dark:text-amber-400';
      case 'save': return 'text-orange-600 dark:text-orange-400';
      case 'network': return 'text-blue-600 dark:text-blue-400';
      case 'permission': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-amber-600 dark:text-amber-400';
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm transition-all duration-300 ease-out",
        "shadow-sm backdrop-blur-sm",
        getErrorStyles(),
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <div className={cn("flex-shrink-0 mt-0.5", getIconColor())}>
          <Info className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-1">
          <p className="font-medium leading-tight">{message}</p>
          {suggestion && <p className="text-xs opacity-80 leading-tight">{suggestion}</p>}
        </div>
      </div>
    </div>
  );
}

