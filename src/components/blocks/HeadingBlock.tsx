
import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    await onUpdate({ text: content });
    setIsEditing(false);
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
      case 'heading1':
        return 'text-3xl font-bold';
      case 'heading2':
        return 'text-2xl font-semibold';
      case 'heading3':
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
          className={`flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHeadingStyle()}`}
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
        className={`flex-1 p-2 rounded cursor-text ${isEditable ? 'hover:bg-gray-50' : ''} ${!content ? 'text-gray-400' : ''} ${getHeadingStyle()}`}
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
