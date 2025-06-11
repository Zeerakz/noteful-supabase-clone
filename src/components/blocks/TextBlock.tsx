
import React, { useState } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { CrdtTextEditor } from './CrdtTextEditor';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';

interface TextBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function TextBlock({ block, onUpdate, onDelete, isEditable }: TextBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { comments } = useComments(block.id);

  const handleContentChange = async (content: any) => {
    await onUpdate(content);
  };

  const handleDelete = async () => {
    await onDelete();
  };

  const textContent = block.content?.text || '';

  if (!isEditable) {
    return (
      <div className="py-1">
        <div 
          className="text-sm whitespace-pre-wrap rich-text-content"
          dangerouslySetInnerHTML={{ 
            __html: textContent || '<span class="text-muted-foreground italic">Empty text block</span>' 
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CrdtTextEditor
        pageId={block.page_id}
        blockId={block.id}
        initialContent={textContent}
        onContentChange={handleContentChange}
        placeholder="Type something..."
        className="w-full"
      />
      
      {isHovered && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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
