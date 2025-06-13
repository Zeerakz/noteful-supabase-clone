
import { useState, useEffect, useRef, useCallback } from 'react';
import { DatabaseField } from '@/types/database';
import { RollupCalculationService } from '@/services/rollupCalculationService';

interface UseLazyRollupCalculationProps {
  pageId: string;
  field: DatabaseField;
  allFields: DatabaseField[];
  isVisible: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface RollupResult {
  value: string | null;
  error?: string;
  isLoading: boolean;
  lastCalculated?: Date;
}

// Global batch queue for rollup calculations
class RollupBatchQueue {
  private queue: Map<string, {
    pageId: string;
    field: DatabaseField;
    allFields: DatabaseField[];
    resolve: (result: { value: string | null; error?: string }) => void;
    reject: (error: Error) => void;
    priority: 'high' | 'normal' | 'low';
  }> = new Map();
  
  private processing = false;
  private batchTimeout: NodeJS.Timeout | null = null;

  add(
    key: string,
    pageId: string,
    field: DatabaseField,
    allFields: DatabaseField[],
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<{ value: string | null; error?: string }> {
    return new Promise((resolve, reject) => {
      // If already queued, update priority if higher
      if (this.queue.has(key)) {
        const existing = this.queue.get(key)!;
        if (this.getPriorityValue(priority) > this.getPriorityValue(existing.priority)) {
          existing.priority = priority;
        }
        return;
      }

      this.queue.set(key, {
        pageId,
        field,
        allFields,
        resolve,
        reject,
        priority
      });

      this.scheduleProcessing();
    });
  }

  private getPriorityValue(priority: 'high' | 'normal' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private scheduleProcessing() {
    if (this.processing) return;

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // For high priority items, process immediately
    const hasHighPriority = Array.from(this.queue.values()).some(
      item => item.priority === 'high'
    );

    const delay = hasHighPriority ? 0 : 100; // 100ms batch delay for normal/low priority

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, delay);
  }

  private async processBatch() {
    if (this.processing || this.queue.size === 0) return;

    this.processing = true;
    const items = Array.from(this.queue.entries());
    this.queue.clear();

    // Sort by priority (high first)
    items.sort((a, b) => 
      this.getPriorityValue(b[1].priority) - this.getPriorityValue(a[1].priority)
    );

    // Process in chunks to avoid overwhelming the system
    const chunkSize = 5;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      await Promise.allSettled(
        chunk.map(async ([key, item]) => {
          try {
            const result = await RollupCalculationService.calculateRollupValue(
              item.pageId,
              item.field,
              item.allFields
            );
            item.resolve(result);
          } catch (error) {
            item.reject(error as Error);
          }
        })
      );

      // Small delay between chunks to prevent blocking
      if (i + chunkSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    this.processing = false;

    // Process any new items that came in while processing
    if (this.queue.size > 0) {
      this.scheduleProcessing();
    }
  }
}

const rollupBatchQueue = new RollupBatchQueue();

export function useLazyRollupCalculation({
  pageId,
  field,
  allFields,
  isVisible,
  priority = 'normal'
}: UseLazyRollupCalculationProps): RollupResult {
  const [result, setResult] = useState<RollupResult>({
    value: null,
    isLoading: false
  });

  const hasCalculated = useRef(false);
  const calculationKey = `${pageId}-${field.id}`;

  const calculate = useCallback(async () => {
    if (hasCalculated.current || !isVisible) return;

    setResult(prev => ({ ...prev, isLoading: true }));
    hasCalculated.current = true;

    try {
      const rollupResult = await rollupBatchQueue.add(
        calculationKey,
        pageId,
        field,
        allFields,
        priority
      );

      setResult({
        value: rollupResult.value,
        error: rollupResult.error,
        isLoading: false,
        lastCalculated: new Date()
      });
    } catch (error) {
      setResult({
        value: null,
        error: error instanceof Error ? error.message : 'Calculation failed',
        isLoading: false
      });
    }
  }, [pageId, field, allFields, isVisible, priority, calculationKey]);

  useEffect(() => {
    if (isVisible && !hasCalculated.current) {
      // Add a small delay for low priority items when they first become visible
      const delay = priority === 'low' ? 200 : priority === 'normal' ? 50 : 0;
      
      const timeout = setTimeout(calculate, delay);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, calculate, priority]);

  // Reset calculation if field configuration changes
  useEffect(() => {
    hasCalculated.current = false;
    setResult({ value: null, isLoading: false });
  }, [field.settings]);

  return result;
}
