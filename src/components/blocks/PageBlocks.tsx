
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
      <div className="space-y-4 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Error loading blocks</span>
        </div>
        <p className="text-sm mb-3">{error}</p>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => refetch()}
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
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
      <div className="p-4 text-center text-gray-500">
        {isEditable ? 'No blocks yet. Start adding content!' : 'This page is empty.'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasErrors && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
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
              className="text-xs h-7"
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
