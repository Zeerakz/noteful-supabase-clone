
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Block } from '@/types/block';
import { blocksQueryKeys } from './queryKeys';

interface BlockError {
  blockId: string;
  error: Error;
  timestamp: number;
  attempts: number;
}

export function useErrorRecovery(workspaceId: string, pageId: string) {
  const [errors, setErrors] = useState<BlockError[]>([]);
  const queryClient = useQueryClient();

  const reportBlockError = useCallback((blockId: string, error: Error) => {
    console.error(`Block error for ${blockId}:`, error);
    
    setErrors(prev => {
      const existing = prev.find(e => e.blockId === blockId);
      if (existing) {
        return prev.map(e => 
          e.blockId === blockId 
            ? { ...e, error, timestamp: Date.now(), attempts: e.attempts + 1 }
            : e
        );
      }
      return [...prev, { blockId, error, timestamp: Date.now(), attempts: 1 }];
    });

    // Show user-friendly error message
    toast({
      title: "Block Error",
      description: `Error rendering block. ${error.message}`,
      variant: "destructive",
    });
  }, []);

  const clearBlockError = useCallback((blockId: string) => {
    setErrors(prev => prev.filter(e => e.blockId !== blockId));
  }, []);

  const retryFailedBlocks = useCallback(async () => {
    console.log('🔄 Retrying failed blocks...');
    
    // Clear errors and trigger refetch
    setErrors([]);
    await queryClient.invalidateQueries({
      queryKey: blocksQueryKeys.page(workspaceId, pageId)
    });
    
    toast({
      title: "Retrying",
      description: "Attempting to reload failed blocks...",
    });
  }, [queryClient, workspaceId, pageId]);

  const getBlockError = useCallback((blockId: string) => {
    return errors.find(e => e.blockId === blockId);
  }, [errors]);

  return {
    errors,
    reportBlockError,
    clearBlockError,
    retryFailedBlocks,
    getBlockError,
    hasErrors: errors.length > 0,
  };
}
