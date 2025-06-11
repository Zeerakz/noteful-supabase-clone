
import React, { useState, useEffect, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { useMarkdownShortcuts } from './hooks/useMarkdownShortcuts';
import { createEmptyDoc, renderToHTML, parseHTMLToJSON } from './utils/contentParser';
import { RichTextEditorProps } from './types';

export function RichTextEditor({ initialContent, onBlur, placeholder = "Start typing..." }: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent || createEmptyDoc());
  const editorRef = useRef<HTMLDivElement>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const { handleMarkdownShortcuts } = useMarkdownShortcuts(editorRef);

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = renderToHTML(initialContent);
    }
  }, [initialContent]);

  const handleFocus = () => {
    setIsToolbarVisible(true);
  };

  const handleBlur = () => {
    setIsToolbarVisible(false);
    if (editorRef.current) {
      const newContent = parseHTMLToJSON(editorRef.current.innerHTML);
      setContent(newContent);
      onBlur(newContent);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      // Check for markdown shortcuts before parsing
      handleMarkdownShortcuts();
      
      const newContent = parseHTMLToJSON(editorRef.current.innerHTML);
      setContent(newContent);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'S':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('strikeThrough');
          }
          break;
      }
    }
    
    // Handle Enter key to prevent markdown shortcuts from being applied on new lines
    if (e.key === 'Enter') {
      // Let the default behavior happen, but we might want to handle this later
      // for better block-level formatting
    }
  };

  return (
    <div className="relative">
      {isToolbarVisible && (
        <EditorToolbar onCommand={execCommand} />
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="w-full min-h-[2.5rem] p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
