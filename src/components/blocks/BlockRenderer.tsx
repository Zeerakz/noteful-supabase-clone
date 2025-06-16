
import React from 'react';
import { Block } from '@/types/block';
import { TextBlock } from './TextBlock';
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
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { errorHandler } from '@/utils/errorHandler';

interface BlockRendererProps {
  block: Block;
  pageId: string;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  onCreateBlock?: (params: any) => Promise<void>;
  isEditable: boolean;
  childBlocks?: Block[];
}

export function BlockRenderer({ block, pageId, onUpdateBlock, onDeleteBlock, onCreateBlock, isEditable, childBlocks = [] }: BlockRendererProps) {
  const handleContentUpdate = async (content: any) => {
    await onUpdateBlock(block.id, { content });
  };

  const handleDelete = async () => {
    await onDeleteBlock(block.id);
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return (
          <TextBlock
            block={block}
            pageId={pageId}
            onUpdate={handleContentUpdate}
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
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      case 'bulleted_list_item':
      case 'numbered_list_item':
        return (
          <ListBlock
            block={block}
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      case 'image':
        return (
          <ImageBlock
            block={block}
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      case 'two_column':
        return (
          <TwoColumnBlock
            block={block}
            pageId={pageId}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
            isEditable={isEditable}
            childBlocks={childBlocks}
          />
        );
      case 'table':
        return (
          <TableBlock
            block={block}
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      case 'divider':
        return (
          <DividerBlock
            block={block}
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      case 'quote':
        return (
          <QuoteBlock
            block={block}
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      case 'callout':
        return (
          <CalloutBlock
            block={block}
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      case 'toggle_list':
        return (
          <ToggleBlock
            block={block}
            pageId={pageId}
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            onUpdateBlock={onUpdateBlock}
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
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      case 'file_attachment':
        return (
          <FileAttachmentBlock
            block={block}
            pageId={pageId}
            onUpdate={handleContentUpdate}
            onDelete={handleDelete}
            isEditable={isEditable}
          />
        );
      default:
        return (
          <div className="p-2 bg-gray-100 border border-dashed border-gray-300 rounded">
            <span className="text-gray-500">Unknown block type: {block.type}</span>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorHandler.logError(error, {
          context: 'block_renderer',
          componentStack: errorInfo.componentStack,
          blockType: block.type,
          blockId: block.id,
        });
      }}
      fallback={
        <div className="p-2 my-2 bg-red-50 border border-red-200 rounded">
          <p className="text-sm font-medium text-red-700">Error rendering block: {block.type}</p>
          <p className="text-xs text-red-600">Check console for details. Block ID: {block.id}</p>
        </div>
      }
    >
      {renderBlock()}
    </ErrorBoundary>
  );
}
