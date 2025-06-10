
import React, { useEffect, useRef, useState } from 'react';
import { useYjsDocument } from '@/hooks/useYjsDocument';

interface CrdtTextEditorProps {
  pageId: string;
  blockId: string;
  initialContent?: string;
  onContentChange: (content: any) => void;
  placeholder?: string;
  className?: string;
}

export function CrdtTextEditor({
  pageId,
  blockId,
  initialContent = '',
  onContentChange,
  placeholder = 'Start typing...',
  className = '',
}: CrdtTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isUpdatingRef = useRef(false);

  const { ytext, isConnected, updateContent, getDocumentContent } = useYjsDocument({
    pageId: `${pageId}-${blockId}`,
    onContentChange: (content) => {
      if (!isUpdatingRef.current) {
        onContentChange({ text: content });
        
        // Update the editor display if content changed externally
        if (editorRef.current && editorRef.current.textContent !== content) {
          isUpdatingRef.current = true;
          editorRef.current.textContent = content;
          isUpdatingRef.current = false;
        }
      }
    },
  });

  // Initialize Y.js document with initial content
  useEffect(() => {
    if (initialContent && ytext.length === 0) {
      updateContent(initialContent);
    }
  }, [initialContent, updateContent, ytext]);

  // Handle local text changes
  const handleInput = () => {
    if (!editorRef.current || isUpdatingRef.current) return;

    const content = editorRef.current.textContent || '';
    const currentContent = getDocumentContent();
    
    if (content !== currentContent) {
      isUpdatingRef.current = true;
      updateContent(content);
      isUpdatingRef.current = false;
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`
          w-full min-h-[2.5rem] p-2 
          border border-input rounded-md 
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
          ${isFocused ? 'ring-2 ring-ring border-ring' : ''}
        `}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
        }}
      />
      
      {/* Connection status indicator */}
      {isFocused && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isConnected ? 'Connected (CRDT enabled)' : 'Disconnected'}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      )}
    </div>
  );
}
