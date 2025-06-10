
import React from 'react';
import { Block } from '@/hooks/useBlocks';
import { TextBlock } from './TextBlock';
import { HeadingBlock } from './HeadingBlock';
import { ListBlock } from './ListBlock';
import { ImageBlock } from './ImageBlock';

interface BlockRendererProps {
  block: Block;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  isEditable: boolean;
}

export function BlockRenderer({ block, onUpdateBlock, onDeleteBlock, isEditable }: BlockRendererProps) {
  const handleContentUpdate = async (content: any) => {
    await onUpdateBlock(block.id, { content });
  };

  const handleDelete = async () => {
    await onDeleteBlock(block.id);
  };

  switch (block.type) {
    case 'text':
      return (
        <TextBlock
          block={block}
          onUpdate={handleContentUpdate}
          onDelete={handleDelete}
          isEditable={isEditable}
        />
      );
    case 'heading1':
    case 'heading2':
    case 'heading3':
      return (
        <HeadingBlock
          block={block}
          onUpdate={handleContentUpdate}
          onDelete={handleDelete}
          isEditable={isEditable}
        />
      );
    case 'bullet_list':
    case 'numbered_list':
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
    default:
      return (
        <div className="p-2 bg-gray-100 border border-dashed border-gray-300 rounded">
          <span className="text-gray-500">Unknown block type: {block.type}</span>
        </div>
      );
  }
}
