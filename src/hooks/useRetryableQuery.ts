
import { useState, useCallback } from 'react';

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export function useRetryableQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: string | null }>,
  config: RetryConfig = {}
) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 8000 } = config;
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async (): Promise<{ data: T | null; error: string | null }> => {
    let lastError: string | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        
        if (attempt > 0) {
          setIsRetrying(true);
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await queryFn();
        
        if (result.error) {
          lastError = result.error;
          // Only retry on network errors or specific database errors
          if (attempt < maxRetries && (
            result.error.includes('Failed to fetch') || 
            result.error.includes('Network') ||
            result.error.includes('fetch')
          )) {
            console.warn(`Query failed, retrying attempt ${attempt + 1}/${maxRetries + 1}:`, result.error);
            continue;
          }
        }
        
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        if (attempt < maxRetries) {
          console.warn(`Query failed, retrying attempt ${attempt + 1}/${maxRetries + 1}:`, lastError);
          continue;
        }
      }
    }
    
    setIsRetrying(false);
    return { data: null, error: lastError || 'Max retries exceeded' };
  }, [queryFn, maxRetries, baseDelay, maxDelay]);

  return {
    executeWithRetry,
    retryCount,
    isRetrying
  };
}
