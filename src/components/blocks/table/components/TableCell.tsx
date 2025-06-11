
import React, { useState, useRef, useEffect } from 'react';

interface TableCellProps {
  content: string;
  pageId: string;
  blockId: string;
  isEditable: boolean;
  onUpdate: (content: any) => Promise<void>;
}

export function TableCell({ content, pageId, blockId, isEditable, onUpdate }: TableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local value when content prop changes
  useEffect(() => {
    setValue(content || '');
  }, [content]);

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    console.log('Saving table cell content:', value);
    try {
      await onUpdate(value);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save table cell content:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(content || '');
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <td className="border-r border-border last:border-r-0 relative group">
      <div className="p-2 min-w-[120px] min-h-[40px]">
        {isEditable && isEditing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-sm"
            placeholder="Enter text..."
          />
        ) : (
          <div
            className="text-sm min-h-[20px] cursor-pointer"
            onDoubleClick={handleDoubleClick}
          >
            {value || (isEditable ? 'Double-click to edit' : '')}
          </div>
        )}
      </div>
    </td>
  );
}
