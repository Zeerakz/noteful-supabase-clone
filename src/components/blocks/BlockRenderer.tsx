
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
import { BlockErrorBoundary } from './BlockErrorBoundary';

interface BlockRendererProps {
  block: Block;
  pageId: string;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
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
