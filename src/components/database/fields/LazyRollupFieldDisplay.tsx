
import React from 'react';
import { DatabaseField } from '@/types/database';
import { useLazyRollupCalculation } from '@/hooks/useLazyRollupCalculation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Calculator, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyRollupFieldDisplayProps {
  field: DatabaseField;
  pageId: string;
  value?: string;
  computedValue?: string;
  allFields: DatabaseField[];
  className?: string;
  priority?: 'high' | 'normal' | 'low';
}

export function LazyRollupFieldDisplay({ 
  field, 
  pageId, 
  value, 
  computedValue, 
  allFields, 
  className = '',
  priority = 'normal'
}: LazyRollupFieldDisplayProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // Start loading before fully visible
    triggerOnce: true // Only calculate once
  });

  const { value: calculatedValue, isLoading, error } = useLazyRollupCalculation({
    pageId,
    field,
    allFields,
    isVisible,
    priority
  });

  const formatDisplayValue = (val: string | null): string => {
    if (!val) return '—';
    
    // Try to parse as number for formatting
    const numValue = parseFloat(val);
    if (!isNaN(numValue)) {
      // Format numbers nicely
      if (numValue === Math.floor(numValue)) {
        return numValue.toString();
      } else {
        return numValue.toFixed(2);
      }
    }
    
    return val;
  };

  const getDisplayVariant = () => {
    if (error) return 'destructive';
    if (isLoading) return 'secondary';
    return 'outline';
  };

  // Use pre-computed value if available, otherwise use calculated value
  const displayValue = computedValue || calculatedValue;

  return (
    <div ref={ref} className={`inline-flex items-center gap-2 ${className}`}>
      {!isVisible || isLoading ? (
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={getDisplayVariant()} className="font-mono text-xs">
                {error ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </>
                ) : (
                  <>
                    <Calculator className="h-3 w-3 mr-1" />
                    {formatDisplayValue(displayValue)}
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                {error ? (
                  <p className="text-destructive">Error: {error}</p>
                ) : (
                  <>
                    <p className="font-medium">{field.name}</p>
                    <p className="text-muted-foreground">
                      Rollup calculation: {field.settings?.aggregation || 'unknown'}
                    </p>
                    {displayValue && (
                      <p className="font-mono text-xs mt-1">
                        Raw value: {displayValue}
                      </p>
                    )}
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
