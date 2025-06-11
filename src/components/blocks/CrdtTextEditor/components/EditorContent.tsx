
import React, { forwardRef } from 'react';

interface EditorContentProps {
  isEditMode: boolean;
  isFocused: boolean;
  placeholder: string;
  onInput: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onMouseUp: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

export const EditorContent = forwardRef<HTMLDivElement, EditorContentProps>(
  ({
    isEditMode,
    isFocused,
    placeholder,
    onInput,
    onFocus,
    onBlur,
    onMouseUp,
    onKeyDown,
    onClick,
    onDoubleClick,
  }, ref) => {
    return (
      <div
        ref={ref}
        contentEditable={isEditMode}
        suppressContentEditableWarning
        onInput={onInput}
        onFocus={onFocus}
        onBlur={onBlur}
        onMouseUp={onMouseUp}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={`
          w-full min-h-[2.5rem] p-2 rounded-md
          rich-text-content
          ${isEditMode && isFocused 
            ? 'border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-text' 
            : 'border border-transparent hover:border-border cursor-pointer'
          }
        `}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
        }}
      />
    );
  }
);

EditorContent.displayName = 'EditorContent';
