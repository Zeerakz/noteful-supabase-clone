
import React, { useEffect } from 'react';
import { EditorToolbar } from '../RichTextEditor/EditorToolbar';
import { LinkDialog } from '../RichTextEditor/LinkDialog';
import { EditorContent } from './components/EditorContent';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useCrdtEditor } from './hooks/useCrdtEditor';
import { useSelectionHandling } from './hooks/useSelectionHandling';
import { CrdtTextEditorProps } from './types';

export function CrdtTextEditor({
  pageId,
  blockId,
  initialContent = '',
  onContentChange,
  placeholder = 'Start typing...',
  className = '',
}: CrdtTextEditorProps) {
  // Always call all hooks in the same order - no conditional hook calls
  const {
    editorRef,
    isFocused,
    isEditMode,
    setIsFocused,
    setIsEditMode,
    isConnected,
    ytext,
    updateContent,
    syncContentToYjs,
    handleInput,
    handleDoubleClick,
    handleFocus,
    handleBlur,
    handleClick,
  } = useCrdtEditor(pageId, blockId, initialContent, onContentChange);

  const {
    showToolbar,
    toolbarPosition,
    handleMouseUp,
    hideToolbar,
  } = useSelectionHandling(isEditMode);

  // Link dialog state - using RichTextEditor pattern
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [selectedText, setSelectedText] = React.useState('');
  const [currentLink, setCurrentLink] = React.useState<{ url: string; text: string } | null>(null);

  // Initialize Y.js document with initial content - always run this effect
  useEffect(() => {
    if (initialContent && ytext && ytext.length === 0) {
      console.log('Initializing Y.js with content:', initialContent);
      updateContent(initialContent);
      
      // Also set the editor content if it's empty
      if (editorRef.current && !editorRef.current.innerHTML) {
        editorRef.current.innerHTML = initialContent;
      }
    }
  }, [initialContent, updateContent, ytext, editorRef]);

  // RichTextEditor-style link handling functions
  const handleCreateLink = () => {
    if (!isEditMode) return;
    
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
    if (!isEditMode || !editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection) return;

    if (currentLink) {
      // Update existing link - use RichTextEditor approach
      document.execCommand('createLink', false, url);
    } else {
      // Create new link - use RichTextEditor approach
      if (selectedText) {
        document.execCommand('createLink', false, url);
        
        // If custom text is provided and different from selected text, update it
        if (text && text !== selectedText) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const linkElement = range.commonAncestorContainer.parentElement;
            if (linkElement && linkElement.tagName === 'A') {
              linkElement.textContent = text;
            }
          }
        }
      } else {
        // No text selected, insert new link
        const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        document.execCommand('insertHTML', false, linkHTML);
      }
    }

    editorRef.current.focus();
    
    // Sync content with Y.js after link creation
    setTimeout(() => {
      syncContentToYjs();
    }, 100);
  };

  const handleRemoveLink = () => {
    if (!isEditMode) return;
    
    document.execCommand('unlink', false);
    editorRef.current?.focus();
    
    // Sync content after removing link
    setTimeout(() => {
      syncContentToYjs();
    }, 100);
  };

  const handleInlineCode = () => {
    if (!isEditMode) return;
    
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
    
    // Sync content after adding inline code
    setTimeout(syncContentToYjs, 100);
  };

  const execCommand = (command: string, value?: string) => {
    if (!isEditMode) return;
    
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
    
    // Sync content after any formatting command
    setTimeout(() => {
      syncContentToYjs();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditMode) return;
    
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

    // Handle Escape to exit edit mode
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditMode(false);
      setIsFocused(false);
      editorRef.current?.blur();
    }
  };

  const handleBlurWithToolbar = () => {
    handleBlur();
    hideToolbar();
  };

  return (
    <div className={`relative ${className}`}>
      <EditorContent
        ref={editorRef}
        isEditMode={isEditMode}
        isFocused={isFocused}
        placeholder={placeholder}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlurWithToolbar}
        onMouseUp={handleMouseUp}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Floating toolbar for text selection */}
      {showToolbar && isEditMode && (
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
      <ConnectionStatus 
        isConnected={isConnected}
        isEditMode={isEditMode}
        isFocused={isFocused}
      />
      
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
