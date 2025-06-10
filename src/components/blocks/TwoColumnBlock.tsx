
import React from 'react';
import { Block } from '@/hooks/useBlocks';
import { BlockRenderer } from './BlockRenderer';

interface TwoColumnBlockProps {
  block: Block;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  isEditable: boolean;
  childBlocks: Block[];
}

export function TwoColumnBlock({ 
  block, 
  onUpdateBlock, 
  onDeleteBlock, 
  isEditable,
  childBlocks 
}: TwoColumnBlockProps) {
  // Get child blocks for each column
  const leftColumnBlocks = childBlocks.filter(
    child => child.parent_block_id === block.id && child.content?.column === 'left'
  );
  
  const rightColumnBlocks = childBlocks.filter(
    child => child.parent_block_id === block.id && child.content?.column === 'right'
  );

  const handleDelete = async () => {
    await onDeleteBlock(block.id);
  };

  return (
    <div className="w-full border border-border rounded-md p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Two Column Layout</span>
        {isEditable && (
          <button
            onClick={handleDelete}
            className="text-xs text-destructive hover:text-destructive/80"
          >
            Delete
          </button>
        )}
      </div>
      
      <div className="flex gap-4">
        {/* Left Column */}
        <div className="flex-1 min-h-[100px] border border-dashed border-border rounded p-3 space-y-2">
          <div className="text-xs text-muted-foreground mb-2">Left Column</div>
          {leftColumnBlocks.length > 0 ? (
            leftColumnBlocks.map((childBlock) => (
              <BlockRenderer
                key={childBlock.id}
                block={childBlock}
                onUpdateBlock={onUpdateBlock}
                onDeleteBlock={onDeleteBlock}
                isEditable={isEditable}
              />
            ))
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Add content to left column...
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex-1 min-h-[100px] border border-dashed border-border rounded p-3 space-y-2">
          <div className="text-xs text-muted-foreground mb-2">Right Column</div>
          {rightColumnBlocks.length > 0 ? (
            rightColumnBlocks.map((childBlock) => (
              <BlockRenderer
                key={childBlock.id}
                block={childBlock}
                onUpdateBlock={onUpdateBlock}
                onDeleteBlock={onDeleteBlock}
                isEditable={isEditable}
              />
            ))
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Add content to right column...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
