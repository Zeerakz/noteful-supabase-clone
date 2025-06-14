import React from 'react';
import { Block } from '@/types/block';
import { BlockRenderer } from './BlockRenderer';
import { ResizableBlock } from './ResizableBlock';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface TwoColumnBlockProps {
  block: Block;
  pageId: string;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  isEditable: boolean;
  childBlocks: Block[];
}

export function TwoColumnBlock({ 
  block, 
  pageId,
  onUpdateBlock, 
  onDeleteBlock, 
  isEditable,
  childBlocks 
}: TwoColumnBlockProps) {
  // Get child blocks for each column
  const leftColumnBlocks = childBlocks.filter(
    child => child.parent_id === block.id && child.content?.column === 'left'
  );
  
  const rightColumnBlocks = childBlocks.filter(
    child => child.parent_id === block.id && child.content?.column === 'right'
  );

  const handleDelete = async () => {
    await onDeleteBlock(block.id);
  };

  const handleSizeChange = async (sizes: number[]) => {
    // Store the column sizes in the block content
    await onUpdateBlock(block.id, {
      content: {
        ...block.content,
        columnSizes: sizes
      }
    });
  };

  const defaultSizes = block.content?.columnSizes || [50, 50];

  const leftColumn = (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-2">Left Column</div>
      {leftColumnBlocks.length > 0 ? (
        leftColumnBlocks.map((childBlock) => (
          <BlockRenderer
            key={childBlock.id}
            block={childBlock}
            pageId={pageId}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
            isEditable={isEditable}
            childBlocks={childBlocks}
          />
        ))
      ) : (
        <div className="text-sm text-muted-foreground italic min-h-[60px] flex items-center">
          Add content to left column...
        </div>
      )}
    </div>
  );

  const rightColumn = (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-2">Right Column</div>
      {rightColumnBlocks.length > 0 ? (
        rightColumnBlocks.map((childBlock) => (
          <BlockRenderer
            key={childBlock.id}
            block={childBlock}
            pageId={pageId}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
            isEditable={isEditable}
            childBlocks={childBlocks}
          />
        ))
      ) : (
        <div className="text-sm text-muted-foreground italic min-h-[60px] flex items-center">
          Add content to right column...
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full border border-border rounded-md p-4 space-y-2 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Two Column Layout</span>
        {isEditable && (
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <ResizableBlock
        defaultSizes={defaultSizes}
        onSizeChange={handleSizeChange}
        showControls={isEditable}
        className="min-h-[150px]"
      >
        {[leftColumn, rightColumn]}
      </ResizableBlock>
    </div>
  );
}
