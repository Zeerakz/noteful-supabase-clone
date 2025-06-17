
import React from 'react';
import { DatabaseField } from '@/types/database';
import { useLazyRollupCalculation } from '@/hooks/useLazyRollupCalculation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Calculator, Loader2, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getRollupDisplayInfo, 
  formatRollupValue, 
  getRollupIcon,
  getAggregationDisplayName 
} from '@/utils/rollupUtils';

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
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true
  });

  const { value: calculatedValue, isLoading, error } = useLazyRollupCalculation({
    pageId,
    field,
    allFields,
    isVisible,
    priority
  });

  const displayValue = computedValue || calculatedValue;
  const rollupInfo = getRollupDisplayInfo(field, allFields);
  const settings = field.settings as any;
  const aggregation = settings?.aggregation || 'unknown';

  const formattedValue = formatRollupValue(displayValue, aggregation);
  const rollupIcon = getRollupIcon(aggregation);

  const getDisplayVariant = () => {
    if (error) return 'destructive';
    if (isLoading) return 'secondary';
    return 'outline';
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    } else if (error) {
      return <AlertCircle className="h-3 w-3" />;
    } else {
      return <Calculator className="h-3 w-3" />;
    }
  };

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
                <span className="mr-1" title={`${getAggregationDisplayName(aggregation)} aggregation`}>
                  {rollupIcon}
                </span>
                {getStatusIcon()}
                <span className="ml-1">
                  {error ? 'Error' : formattedValue}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="text-sm space-y-2">
                {error ? (
                  <>
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Calculation Error</span>
                    </div>
                    <p className="text-muted-foreground">{error}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span className="font-medium">{field.name}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <Info className="h-3 w-3 mt-0.5 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs leading-relaxed">
                          {rollupInfo.description}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Aggregation:</span>
                        <span className="font-medium">{rollupInfo.aggregationType}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Relation:</span>
                        <span className="font-medium">{rollupInfo.relationField}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Property:</span>
                        <span className="font-medium">{rollupInfo.targetProperty}</span>
                      </div>
                    </div>

                    {displayValue && (
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Result:</span>
                          <code className="bg-muted px-1 rounded text-xs">{formattedValue}</code>
                        </div>
                        {displayValue !== formattedValue && (
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Raw:</span>
                            <code className="bg-muted px-1 rounded text-xs">{displayValue}</code>
                          </div>
                        )}
                      </div>
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
