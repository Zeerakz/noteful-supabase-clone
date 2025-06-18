
import React from 'react';
import { useBlockOperations } from '@/hooks/blocks/useBlockOperations';
import { useErrorRecovery } from '@/hooks/blocks/useErrorRecovery';
import { DraggableBlockList } from './DraggableBlockList';
import { Block, BlockType } from '@/types/block';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface PageBlocksProps {
  workspaceId: string;
  pageId: string;
  isEditable?: boolean;
}

export function PageBlocks({ workspaceId, pageId, isEditable = false }: PageBlocksProps) {
  const { blocks, loading, error, createBlock, updateBlock, deleteBlock, refetch } = useBlockOperations(workspaceId, pageId);
  const { 
    errors, 
    reportBlockError, 
    retryFailedBlocks, 
    hasErrors 
  } = useErrorRecovery(workspaceId, pageId);

  const handleUpdateBlock = async (id: string, updates: any) => {
    try {
      console.log('🔄 PageBlocks - updating block:', id, updates);
      const result = await updateBlock(id, updates);
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error updating block:', error);
      reportBlockError(id, error as Error);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      console.log('🗑️ PageBlocks - deleting block:', id);
      const result = await deleteBlock(id);
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error deleting block:', error);
      reportBlockError(id, error as Error);
    }
  };

  const handleCreateBlock = async (params: { type: BlockType; content?: any; parent_id?: string; pos?: number }) => {
    try {
      console.log('➕ PageBlocks - creating block:', params);
      const result = await createBlock(params);
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error creating block:', error);
      reportBlockError('new-block', error as Error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-6">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-destructive text-sm">Error loading blocks</span>
          </div>
          <p className="text-sm text-destructive/80 mb-3">{error}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => refetch()}
            className="h-7 px-3 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Sort blocks by position to ensure correct order
  const sortedBlocks = [...blocks].sort((a, b) => (a.pos || 0) - (b.pos || 0));
  const parentBlocks = sortedBlocks.filter(block => block.parent_id === pageId);
  const childBlocks = sortedBlocks.filter(block => block.parent_id && block.parent_id !== pageId);

  console.log('📦 PageBlocks render - blocks:', {
    total: blocks.length,
    parent: parentBlocks.length,
    child: childBlocks.length,
    isEditable
  });

  if (parentBlocks.length === 0 && !loading) {
    return (
      <div className="py-12 text-center">
        <div className="text-muted-foreground text-sm">
          {isEditable ? 'No blocks yet. Start adding content!' : 'This page is empty.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasErrors && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {errors.length} block error{errors.length > 1 ? 's' : ''} detected
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={retryFailedBlocks}
              className="h-7 px-3 text-xs border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry All
            </Button>
          </div>
        </div>
      )}
      
      <DraggableBlockList
        blocks={parentBlocks}
        pageId={pageId}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        onCreateBlock={handleCreateBlock}
        isEditable={isEditable}
        childBlocks={childBlocks}
        onReportError={reportBlockError}
        onRetry={refetch}
      />
    </div>
  );
}
