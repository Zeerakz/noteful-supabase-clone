
import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Block } from '@/types/block';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface HeadingBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function HeadingBlock({ block, onUpdate, onDelete, isEditable }: HeadingBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [content, setContent] = useState(block.content?.text || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isEditing) {
      setContent(block.content?.text || '');
    }
  }, [block.content?.text, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (content === (block.content?.text || '')) {
      setIsEditing(false);
      return;
    }
    try {
      await onUpdate({ text: content });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update heading:', error);
      toast({
        title: 'Error',
        description: 'Failed to save heading.',
        variant: 'destructive',
      });
      setContent(block.content?.text || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setContent(block.content?.text || '');
      setIsEditing(false);
    }
  };

  const getHeadingStyle = () => {
    switch (block.type) {
      case 'heading_1':
        return 'text-3xl font-bold';
      case 'heading_2':
        return 'text-2xl font-semibold';
      case 'heading_3':
        return 'text-xl font-medium';
      default:
        return 'text-lg font-medium';
    }
  };

  if (!isEditable && !content) {
    return null;
  }

  if (isEditing) {
    return (
      <div className="group relative flex items-center gap-2">
        <input
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`flex-1 p-2 bg-transparent border-none outline-none focus:bg-accent/10 hover:bg-muted/50 rounded transition-colors ${getHeadingStyle()}`}
          placeholder="Heading..."
        />
      </div>
    );
  }

  return (
    <div
      className="group relative flex items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex-1 p-2 rounded cursor-text bg-transparent hover:bg-muted/50 transition-colors ${!content ? 'text-muted-foreground' : ''} ${getHeadingStyle()}`}
        onClick={() => isEditable && setIsEditing(true)}
      >
        {content || (isEditable ? 'Click to add heading...' : '')}
      </div>
      
      {isEditable && isHovered && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
