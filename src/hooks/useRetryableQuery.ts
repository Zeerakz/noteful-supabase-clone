
import { useState, useCallback } from 'react';

export interface RetryableQueryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export function useRetryableQuery<T>(
  queryFn: () => Promise<T>,
  options: RetryableQueryOptions = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async (): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setIsRetrying(true);
          setRetryCount(attempt);
          
          // Calculate delay with exponential backoff
          const delay = Math.min(
            baseDelay * Math.pow(backoffMultiplier, attempt - 1),
            maxDelay
          );
          
          console.log(`Retrying query, attempt ${attempt}/${maxRetries}, delay: ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await queryFn();
        
        // Reset retry state on success
        if (attempt > 0) {
          setIsRetrying(false);
          setRetryCount(0);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Query attempt ${attempt + 1} failed:`, lastError.message);
        
        // If this is the last attempt, don't continue
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    setIsRetrying(false);
    setRetryCount(0);
    throw lastError || new Error('Query failed after all retries');
  }, [queryFn, maxRetries, baseDelay, maxDelay, backoffMultiplier]);

  return {
    executeWithRetry,
    isRetrying,
    retryCount
  };
}
