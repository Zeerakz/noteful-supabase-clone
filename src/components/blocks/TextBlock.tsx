
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

  // Handle clicks on links in read-only mode
  const handleReadOnlyClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const linkElement = target.closest('a');
    
    if (linkElement && linkElement.href) {
      e.preventDefault();
      e.stopPropagation();
      window.open(linkElement.href, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isEditable) {
    return (
      <div className="py-1">
        <div 
          className="text-sm whitespace-pre-wrap rich-text-content cursor-default"
          dangerouslySetInnerHTML={{ 
            __html: textContent || '<span class="text-muted-foreground italic">Empty text block</span>' 
          }}
          onClick={handleReadOnlyClick}
          style={{ pointerEvents: 'auto' }}
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
        showCommentButton={isHovered}
        comments={comments}
        onOpenComments={() => setIsCommentPanelOpen(true)}
      />
      
      {isHovered && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
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

      <CommentThreadPanel
        blockId={block.id}
        isOpen={isCommentPanelOpen}
        onOpenChange={setIsCommentPanelOpen}
      />
    </div>
  );
}
