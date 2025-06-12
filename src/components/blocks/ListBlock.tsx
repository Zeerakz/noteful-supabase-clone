
import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';

interface ListBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function ListBlock({ block, onUpdate, onDelete, isEditable }: ListBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [items, setItems] = useState<string[]>(block.content?.items || ['']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const cleanItems = items.filter(item => item.trim() !== '');
    await onUpdate({ items: cleanItems });
    setIsEditing(false);
  };

  const handleTextChange = (value: string) => {
    const newItems = value.split('\n');
    setItems(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setItems(block.content?.items || ['']);
      setIsEditing(false);
    }
  };

  const isBulletList = block.type === 'bullet_list';

  if (!isEditable && (!items || items.length === 0)) {
    return null;
  }

  if (isEditing) {
    return (
      <div className="group relative flex items-center gap-2">
        <textarea
          ref={textareaRef}
          value={items.join('\n')}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[4rem] p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter list items (one per line)..."
          rows={Math.max(3, items.length + 1)}
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
        className={`flex-1 p-2 rounded cursor-text ${isEditable ? 'hover:bg-gray-50' : ''}`}
        onClick={() => isEditable && setIsEditing(true)}
      >
        {isBulletList ? (
          <ul className="list-disc list-inside space-y-1">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <ol className="list-decimal list-inside space-y-1">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        )}
        {items.length === 0 && isEditable && (
          <span className="text-gray-400">Click to add list items...</span>
        )}
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
