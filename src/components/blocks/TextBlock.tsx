
import React, { useState } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { CrdtTextEditor } from './CrdtTextEditor';
import { CommentsSection } from './CommentsSection';

interface TextBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function TextBlock({ block, onUpdate, onDelete, isEditable }: TextBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

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
        <div className="text-sm whitespace-pre-wrap">
          {textContent || (
            <span className="text-muted-foreground italic">Empty text block</span>
          )}
        </div>
        <CommentsSection blockId={block.id} />
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
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <CommentsSection blockId={block.id} />
    </div>
  );
}
