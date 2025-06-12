
import React, { useState } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';

interface DividerBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function DividerBlock({ block, onUpdate, onDelete, isEditable }: DividerBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { comments } = useComments(block.id);

  const handleDelete = async () => {
    await onDelete();
  };

  if (!isEditable) {
    return (
      <div className="py-3">
        <Separator className="w-full" />
      </div>
    );
  }

  return (
    <div
      className="group relative py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Separator className="w-full" />
      
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
