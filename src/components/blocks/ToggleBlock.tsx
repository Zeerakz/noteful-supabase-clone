import React, { useState } from 'react';
import { Block } from '@/types/block';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { BlockRenderer } from './BlockRenderer';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';

interface ToggleBlockProps {
  block: Block;
  pageId: string;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  onCreateBlock?: (params: any) => Promise<void>;
  isEditable: boolean;
  childBlocks?: Block[];
}

export function ToggleBlock({ 
  block, 
  pageId,
  onUpdate, 
  onDelete, 
  onUpdateBlock,
  onDeleteBlock,
  onCreateBlock,
  isEditable, 
  childBlocks = [] 
}: ToggleBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { comments } = useComments(block.id);

  const isExpanded = block.content?.expanded ?? true;
  const title = block.content?.title || '';

  const handleTitleChange = async (newTitle: string) => {
    await onUpdate({ 
      ...block.content,
      title: newTitle 
    });
  };

  const handleToggle = async () => {
    await onUpdate({ 
      ...block.content,
      expanded: !isExpanded 
    });
  };

  const handleDelete = async () => {
    await onDelete();
  };

  const handleAddChildBlock = async () => {
    if (onCreateBlock) {
      await onCreateBlock({ type: 'text', parent_id: block.id });
    }
  };

  const handleEmptyAreaClick = (e: React.MouseEvent) => {
    // Only handle clicks on the empty area itself, not on child elements
    if (e.target === e.currentTarget && isEditable && onCreateBlock) {
      handleAddChildBlock();
    }
  };

  // Get child blocks that belong to this toggle block
  const toggleChildBlocks = childBlocks.filter(child => child.parent_id === block.id);

  if (!isEditable) {
    return (
      <div className="my-4">
        <div 
          className="flex items-center gap-2 py-2 cursor-pointer hover:bg-muted/50 rounded"
          onClick={handleToggle}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div 
            className="flex-1 font-medium"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        </div>
        
        {isExpanded && toggleChildBlocks.length > 0 && (
          <div className="ml-6 mt-2 space-y-2">
            {toggleChildBlocks.map((childBlock) => (
              <BlockRenderer
                key={childBlock.id}
                block={childBlock}
                pageId={pageId}
                onUpdateBlock={onUpdateBlock}
                onDeleteBlock={onDeleteBlock}
                onCreateBlock={onCreateBlock}
                isEditable={isEditable}
                childBlocks={childBlocks}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="group relative my-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-8 w-8 p-0 mt-1 hover:bg-muted flex-shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex-1">
          <RichTextEditor
            initialContent={title}
            onBlur={handleTitleChange}
            placeholder="Toggle title..."
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="ml-6 mt-2 border-l-2 border-muted pl-4">
          <div className="space-y-2">
            {toggleChildBlocks.map((childBlock) => (
              <BlockRenderer
                key={childBlock.id}
                block={childBlock}
                pageId={pageId}
                onUpdateBlock={onUpdateBlock}
                onDeleteBlock={onDeleteBlock}
                onCreateBlock={onCreateBlock}
                isEditable={isEditable}
                childBlocks={childBlocks}
              />
            ))}
          </div>
          
          {/* Empty area for adding new blocks */}
          <div 
            className="min-h-[40px] py-2 cursor-pointer hover:bg-muted/30 rounded transition-colors"
            onClick={handleEmptyAreaClick}
          >
            {toggleChildBlocks.length === 0 ? (
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Click here to add content inside the toggle...
              </div>
            ) : (
              <div className="text-muted-foreground text-sm opacity-0 hover:opacity-100 transition-opacity flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add block
              </div>
            )}
          </div>
        </div>
      )}
      
      {isHovered && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
          <CommentThreadPanel
            blockId={block.id}
            isOpen={isCommentPanelOpen}
            onOpenChange={setIsCommentPanelOpen}
          >
            <CommentIcon
              hasComments={comments.length > 0}
              commentCount={comments.length}
              onClick={() => setIsCommentPanelOpen(true)}
            />
          </CommentThreadPanel>
          
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
