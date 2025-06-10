
import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';

interface TextBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function TextBlock({ block, onUpdate, onDelete, isEditable }: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content?.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    await onUpdate({ text: content });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setContent(block.content?.text || '');
      setIsEditing(false);
    }
  };

  if (!isEditable && !content) {
    return null;
  }

  if (isEditing) {
    return (
      <div className="group relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[2.5rem] p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type something..."
          rows={Math.max(1, content.split('\n').length)}
        />
      </div>
    );
  }

  return (
    <div className="group relative">
      <div
        className={`p-2 rounded cursor-text ${isEditable ? 'hover:bg-gray-50' : ''} ${!content ? 'text-gray-400' : ''}`}
        onClick={() => isEditable && setIsEditing(true)}
      >
        {content || (isEditable ? 'Click to add text...' : '')}
      </div>
      {isEditable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
