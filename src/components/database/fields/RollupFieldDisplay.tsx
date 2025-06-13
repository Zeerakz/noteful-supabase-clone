import React, { useEffect, useState } from 'react';
import { DatabaseField } from '@/types/database';
import { BatchedRollupService } from '@/services/batchedRollupService';
import { Calculator, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [calculatedValue, setCalculatedValue] = useState<string | null>(computedValue || null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the new batched service for calculations
  useEffect(() => {
    const calculateValue = async () => {
      if (!pageId || !field.id || computedValue) return;

      setIsCalculating(true);
      setError(null);

      try {
        const { value: newValue, error: calcError } = await BatchedRollupService.queueRollupCalculation(
          pageId,
          field,
          allFields
        );

        if (calcError) {
          setError(calcError);
        } else {
          setCalculatedValue(newValue);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Calculation failed');
      } finally {
        setIsCalculating(false);
      }
    };

    calculateValue();
  }, [pageId, field, allFields, computedValue]);

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
                  {formatDisplayValue(calculatedValue)}
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
                {calculatedValue && (
                  <p className="font-mono text-xs mt-1">
                    Raw value: {calculatedValue}
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
