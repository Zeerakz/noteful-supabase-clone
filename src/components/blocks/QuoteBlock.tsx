
import React, { useState } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';

interface QuoteBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function QuoteBlock({ block, onUpdate, onDelete, isEditable }: QuoteBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { comments } = useComments(block.id);

  const handleContentChange = async (content: string) => {
    await onUpdate({ text: content });
  };

  const handleDelete = async () => {
    await onDelete();
  };

  if (!isEditable) {
    return (
      <div className="border-l-4 border-accent pl-6 py-2 my-4 bg-muted/30">
        <div 
          className="rich-text-content text-muted-foreground italic"
          dangerouslySetInnerHTML={{ __html: block.content?.text || '' }}
        />
      </div>
    );
  }

  return (
    <div
      className="group relative border-l-4 border-accent pl-6 py-2 my-4 bg-muted/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <RichTextEditor
        content={block.content?.text || ''}
        onContentChange={handleContentChange}
        placeholder="Enter a quote..."
        className="text-muted-foreground italic"
      />
      
      {isHovered && (
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
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
