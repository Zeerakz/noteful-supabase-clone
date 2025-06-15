
import React from 'react';
import { DatabaseField } from '@/types/database';
import { Calculator, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLazyRollupCalculation } from '@/hooks/useLazyRollupCalculation';

interface RollupFieldDisplayProps {
  field: DatabaseField;
  pageId: string;
  value?: string;
  computedValue?: string;
  allFields: DatabaseField[];
  className?: string;
}

export function RollupFieldDisplay({ 
  field, 
  pageId, 
  value, 
  computedValue, 
  allFields, 
  className = '' 
}: RollupFieldDisplayProps) {
  const { 
    value: calculatedValue, 
    isLoading: isCalculating, 
    error 
  } = useLazyRollupCalculation({
    pageId: pageId,
    field: field,
    allFields: allFields,
    isVisible: true, // In this context, we assume it's always visible
    priority: 'normal',
  });

  const displayValue = computedValue || calculatedValue;

  const formatDisplayValue = (val: string | null): string => {
    if (val === null || val === undefined) return '—';
    
    // Try to parse as number for formatting
    const numValue = parseFloat(val);
    if (!isNaN(numValue)) {
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
    if (isCalculating) return 'secondary';
    return 'outline';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-2 ${className}`}>
            <Badge variant={getDisplayVariant()} className="font-mono text-xs">
              {isCalculating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Calculating...
                </>
              ) : error ? (
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
          </div>
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
  );
}
