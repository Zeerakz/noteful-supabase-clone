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
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const isUpdatingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { ytext, isConnected, updateContent, getDocumentContent } = useYjsDocument({
    pageId: `${pageId}-${blockId}`,
    onContentChange: (content) => {
      if (!isUpdatingRef.current) {
        // Debounce the content save to avoid too many rapid updates
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          onContentChange({ text: content });
        }, 500); // Save after 500ms of no changes
        
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
    // Save content immediately when losing focus
    if (editorRef.current) {
      const content = editorRef.current.innerHTML || '';
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      onContentChange({ text: content });
    }
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

  // Handle clicks on links - properly handle both editing and non-editing modes
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if clicked element is a link or inside a link
    let linkElement = target.closest('a');
    
    if (linkElement && linkElement.href) {
      // If we're not currently selecting text or in editing mode, open the link
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().trim().length > 0;
      
      if (!hasSelection) {
        e.preventDefault();
        e.stopPropagation();
        
        // Open link in new tab
        window.open(linkElement.href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  };

  const restoreSelection = () => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
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
    
    // Save the current selection
    saveSelection();
    
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
      setSavedSelection(linkRange.cloneRange());
    } else {
      // Creating new link
      setCurrentLink(null);
      setSelectedText(selectedText);
    }
    
    setIsLinkDialogOpen(true);
  };

  const handleSaveLink = (url: string, text: string) => {
    // Restore the selection first
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection) return;

    // Ensure we have a proper URL format
    let formattedUrl = url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    if (currentLink) {
      // Update existing link - replace the selected link entirely
      const linkHTML = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      document.execCommand('insertHTML', false, linkHTML);
    } else {
      // Create new link
      if (selectedText && selectedText.trim()) {
        // Use the provided text or fall back to selected text
        const linkText = text.trim() || selectedText;
        const linkHTML = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        document.execCommand('insertHTML', false, linkHTML);
      } else {
        // No text selected, insert new link with provided text
        const linkText = text.trim() || formattedUrl;
        const linkHTML = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        document.execCommand('insertHTML', false, linkHTML);
      }
    }

    // Clear saved selection
    setSavedSelection(null);
    
    // Focus back to editor
    editorRef.current?.focus();
    
    // Update content after creating/editing link
    setTimeout(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML || '';
        isUpdatingRef.current = true;
        updateContent(content);
        isUpdatingRef.current = false;
      }
    }, 100);
  };

  const handleRemoveLink = () => {
    // Restore selection first
    restoreSelection();
    
    document.execCommand('unlink', false);
    
    // Clear saved selection
    setSavedSelection(null);
    
    editorRef.current?.focus();
    
    // Update content after removing link
    setTimeout(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML || '';
        isUpdatingRef.current = true;
        updateContent(content);
        isUpdatingRef.current = false;
      }
    }, 100);
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
        onClose={() => {
          setIsLinkDialogOpen(false);
          setSavedSelection(null);
        }}
        onSave={handleSaveLink}
        onRemove={currentLink ? handleRemoveLink : undefined}
        initialUrl={currentLink?.url || ''}
        initialText={currentLink?.text || selectedText}
        isEditing={!!currentLink}
      />
    </div>
  );
}
