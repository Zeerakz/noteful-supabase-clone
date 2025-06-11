
import React, { useEffect, useRef, useState } from 'react';
import { useYjsDocument } from '@/hooks/useYjsDocument';
import { EditorToolbar } from './RichTextEditor/EditorToolbar';
import { LinkDialog } from './RichTextEditor/LinkDialog';

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
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [currentLink, setCurrentLink] = useState<{ url: string; text: string } | null>(null);
  const isUpdatingRef = useRef(false);

  const { ytext, isConnected, updateContent, getDocumentContent } = useYjsDocument({
    pageId: `${pageId}-${blockId}`,
    onContentChange: (content) => {
      if (!isUpdatingRef.current) {
        onContentChange({ text: content });
        
        // Update the editor display if content changed externally
        if (editorRef.current && editorRef.current.innerHTML !== content) {
          isUpdatingRef.current = true;
          editorRef.current.innerHTML = content;
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

    const content = editorRef.current.innerHTML || '';
    const currentContent = getDocumentContent();
    
    if (content !== currentContent) {
      isUpdatingRef.current = true;
      updateContent(content);
      isUpdatingRef.current = false;
    }
  };

  const handleFocus = () => setIsFocused(true);
  
  const handleBlur = () => {
    setIsFocused(false);
    // Small delay to allow toolbar clicks
    setTimeout(() => setShowToolbar(false), 150);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2) - 100,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  // Handle clicks on links - only when not actively editing
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if clicked element is a link or inside a link
    let linkElement = target.closest('a');
    
    if (linkElement && linkElement.href) {
      // If we're not focused (not actively editing), allow link to open
      if (!isFocused) {
        e.preventDefault();
        e.stopPropagation();
        
        // Open link in new tab
        window.open(linkElement.href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    if (command === 'createLink') {
      handleCreateLink();
      return;
    }
    
    if (command === 'insertHTML' && value === '<code></code>') {
      handleInlineCode();
      return;
    }
    
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    
    // Update content after formatting
    if (editorRef.current) {
      const content = editorRef.current.innerHTML || '';
      isUpdatingRef.current = true;
      updateContent(content);
      isUpdatingRef.current = false;
    }
  };

  const handleInlineCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString();
    if (selectedText) {
      // Wrap selected text in code tags
      const codeHTML = `<code>${selectedText}</code>`;
      document.execCommand('insertHTML', false, codeHTML);
    } else {
      // Insert empty code tags and place cursor inside
      const codeHTML = '<code></code>';
      document.execCommand('insertHTML', false, codeHTML);
      
      // Move cursor inside the code tags
      const range = selection.getRangeAt(0);
      const codeElement = range.startContainer.parentElement?.querySelector('code:last-child');
      if (codeElement) {
        const newRange = document.createRange();
        newRange.setStart(codeElement, 0);
        newRange.setEnd(codeElement, 0);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
    
    editorRef.current?.focus();
    
    // Update content after adding inline code
    if (editorRef.current) {
      const content = editorRef.current.innerHTML || '';
      isUpdatingRef.current = true;
      updateContent(content);
      isUpdatingRef.current = false;
    }
  };

  const handleCreateLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Check if we're clicking on an existing link
    let linkElement: HTMLAnchorElement | null = null;
    let currentElement = range.commonAncestorContainer;
    
    // Traverse up to find if we're inside a link
    while (currentElement && currentElement !== editorRef.current) {
      if (currentElement.nodeType === Node.ELEMENT_NODE) {
        const element = currentElement as HTMLElement;
        if (element.tagName === 'A') {
          linkElement = element as HTMLAnchorElement;
          break;
        }
      }
      currentElement = currentElement.parentNode;
    }

    if (linkElement) {
      // Editing existing link
      setCurrentLink({
        url: linkElement.href,
        text: linkElement.textContent || ''
      });
      setSelectedText(linkElement.textContent || '');
      
      // Select the entire link for editing
      const linkRange = document.createRange();
      linkRange.selectNode(linkElement);
      selection.removeAllRanges();
      selection.addRange(linkRange);
    } else {
      // Creating new link
      setCurrentLink(null);
      setSelectedText(selectedText);
    }
    
    setIsLinkDialogOpen(true);
  };

  const handleSaveLink = (url: string, text: string) => {
    const selection = window.getSelection();
    if (!selection) return;

    if (currentLink) {
      // Update existing link
      const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      document.execCommand('insertHTML', false, linkHTML);
    } else {
      // Create new link
      if (selectedText) {
        // Use the selected text but update with custom text if provided
        const linkText = text || selectedText;
        const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        document.execCommand('insertHTML', false, linkHTML);
      } else {
        // No text selected, insert new link
        const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        document.execCommand('insertHTML', false, linkHTML);
      }
    }

    editorRef.current?.focus();
    
    // Update content after creating/editing link
    if (editorRef.current) {
      const content = editorRef.current.innerHTML || '';
      isUpdatingRef.current = true;
      updateContent(content);
      isUpdatingRef.current = false;
    }
  };

  const handleRemoveLink = () => {
    document.execCommand('unlink', false);
    editorRef.current?.focus();
    
    // Update content after removing link
    if (editorRef.current) {
      const content = editorRef.current.innerHTML || '';
      isUpdatingRef.current = true;
      updateContent(content);
      isUpdatingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts for formatting
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
        case 'k':
          e.preventDefault();
          handleCreateLink();
          break;
        case '`':
          e.preventDefault();
          handleInlineCode();
          break;
        case 'S':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('strikeThrough');
          }
          break;
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseUp={handleMouseUp}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={`
          w-full min-h-[2.5rem] p-2 
          border border-input rounded-md 
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
          rich-text-content
          ${isFocused ? 'ring-2 ring-ring border-ring' : ''}
        `}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
        }}
      />
      
      {/* Floating toolbar for text selection */}
      {showToolbar && (
        <div
          className="fixed z-50 bg-background border border-border rounded-md shadow-lg"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
          }}
        >
          <EditorToolbar onCommand={execCommand} />
        </div>
      )}
      
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
      
      <LinkDialog
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        onSave={handleSaveLink}
        onRemove={currentLink ? handleRemoveLink : undefined}
        initialUrl={currentLink?.url || ''}
        initialText={currentLink?.text || selectedText}
        isEditing={!!currentLink}
      />
    </div>
  );
}
