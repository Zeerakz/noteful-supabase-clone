
import React from 'react';
import { Block } from '@/types/block';
import { ImprovedTextBlock } from './ImprovedTextBlock';
import { HeadingBlock } from './HeadingBlock';
import { ListBlock } from './ListBlock';
import { ImageBlock } from './ImageBlock';
import { TwoColumnBlock } from './TwoColumnBlock';
import { TableBlock } from './TableBlock';
import { DividerBlock } from './DividerBlock';
import { QuoteBlock } from './QuoteBlock';
import { CalloutBlock } from './CalloutBlock';
import { ToggleBlock } from './ToggleBlock';
import { EmbedBlock } from './EmbedBlock';
import { FileAttachmentBlock } from './FileAttachmentBlock';
import { BlockErrorBoundary } from './BlockErrorBoundary';

interface BlockRendererProps {
  block: Block;
  pageId: string;
  onUpdateBlock: (id: string, updates: any) => Promise<{ data: any; error: string | null }>;
  onDeleteBlock: (id: string) => Promise<void>;
  onCreateBlock?: (params: any) => Promise<void>;
  isEditable: boolean;
  childBlocks?: Block[];
  onReportError?: (blockId: string, error: Error) => void;
  onRetry?: () => void;
}

export function BlockRenderer({ 
  block, 
  pageId, 
  onUpdateBlock, 
  onDeleteBlock, 
  onCreateBlock, 
  isEditable, 
  childBlocks = [],
  onReportError,
  onRetry
}: BlockRendererProps) {
  const handleContentUpdate = async (content: any) => {
    try {
      return await onUpdateBlock(block.id, { content });
    } catch (error) {
      console.error('Error updating block content:', error);
      onReportError?.(block.id, error as Error);
      return { data: null, error: (error as Error).message };
    }
  };

  const handleDelete = async () => {
    try {
      await onDeleteBlock(block.id);
    } catch (error) {
      console.error('Error deleting block:', error);
      onReportError?.(block.id, error as Error);
    }
  };

  // Wrapper to convert the standardized return type to void for component compatibility
  const createVoidUpdateHandler = (updateFn: (content: any) => Promise<{ data: any; error: string | null }>) => {
    return async (content: any): Promise<void> => {
      const result = await updateFn(content);
      if (result.error) {
        throw new Error(result.error);
      }
    };
  };

  // Wrapper for onUpdateBlock that maintains the proper return type
  const createCompatibleUpdateHandler = () => {
    return async (id: string, updates: any): Promise<{ data: any; error: string | null }> => {
      try {
        const result = await onUpdateBlock(id, updates);
        return result;
      } catch (error) {
        console.error('Error in compatible update handler:', error);
        onReportError?.(id, error as Error);
        return { data: null, error: (error as Error).message };
      }
    };
  };

  const renderBlock = () => {
    try {
      switch (block.type) {
        case 'text':
          return (
            <ImprovedTextBlock
              block={block}
              pageId={pageId}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'heading_1':
        case 'heading_2':
        case 'heading_3':
          return (
            <HeadingBlock
              block={block}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'bulleted_list_item':
        case 'numbered_list_item':
          return (
            <ListBlock
              block={block}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'image':
          return (
            <ImageBlock
              block={block}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'two_column':
          return (
            <TwoColumnBlock
              block={block}
              pageId={pageId}
              onUpdateBlock={createCompatibleUpdateHandler()}
              onDeleteBlock={onDeleteBlock}
              isEditable={isEditable}
              childBlocks={childBlocks}
            />
          );
        case 'table':
          return (
            <TableBlock
              block={block}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'divider':
          return (
            <DividerBlock
              block={block}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'quote':
          return (
            <QuoteBlock
              block={block}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'callout':
          return (
            <CalloutBlock
              block={block}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'toggle_list':
          return (
            <ToggleBlock
              block={block}
              pageId={pageId}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              onUpdateBlock={createCompatibleUpdateHandler()}
              onDeleteBlock={onDeleteBlock}
              onCreateBlock={onCreateBlock}
              isEditable={isEditable}
              childBlocks={childBlocks}
            />
          );
        case 'embed':
          return (
            <EmbedBlock
              block={block}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        case 'file_attachment':
          return (
            <FileAttachmentBlock
              block={block}
              pageId={pageId}
              onUpdate={createVoidUpdateHandler(handleContentUpdate)}
              onDelete={handleDelete}
              isEditable={isEditable}
            />
          );
        default:
          return (
            <div className="p-3 my-2 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700">
                <span className="text-sm font-medium">Unsupported block type:</span>
                <span className="text-sm font-mono bg-amber-100 px-2 py-1 rounded">
                  {block.type}
                </span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                This block type is not yet implemented. Block ID: {block.id}
              </p>
              {isEditable && (
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
                >
                  Remove this block
                </button>
              )}
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering block:', error);
      return (
        <div className="p-3 my-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-sm font-medium">Error rendering block</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            Block ID: {block.id}, Type: {block.type}
          </p>
          {isEditable && (
            <div className="mt-2 space-x-2">
              <button
                onClick={() => onRetry?.()}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Remove block
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <BlockErrorBoundary
      blockId={block.id}
      blockType={block.type}
      onReportError={onReportError}
      onRetry={onRetry}
    >
      {renderBlock()}
    </BlockErrorBoundary>
  );
}
