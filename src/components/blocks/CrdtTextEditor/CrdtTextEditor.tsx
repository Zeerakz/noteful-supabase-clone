
import React, { useEffect } from 'react';
import { EditorToolbar } from '../RichTextEditor/EditorToolbar';
import { LinkDialog } from '../RichTextEditor/LinkDialog';
import { EditorContent } from './components/EditorContent';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useCrdtEditor } from './hooks/useCrdtEditor';
import { useSelectionHandling } from './hooks/useSelectionHandling';
import { useLinkHandling } from './hooks/useLinkHandling';
import { CrdtTextEditorProps } from './types';

export function CrdtTextEditor({
  pageId,
  blockId,
  initialContent = '',
  onContentChange,
  placeholder = 'Start typing...',
  className = '',
}: CrdtTextEditorProps) {
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
    ensureLinkStyling,
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

  const {
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    selectedText,
    currentLink,
    handleCreateLink,
    handleSaveLink,
    handleRemoveLink,
    setSavedSelection,
  } = useLinkHandling(isEditMode, editorRef, syncContentToYjs);

  // Initialize Y.js document with initial content
  useEffect(() => {
    if (initialContent && ytext.length === 0) {
      console.log('Initializing Y.js with content:', initialContent);
      updateContent(initialContent);
      
      // Also set the editor content if it's empty
      if (editorRef.current && !editorRef.current.innerHTML) {
        editorRef.current.innerHTML = initialContent;
        // Ensure proper link styling on initialization
        setTimeout(ensureLinkStyling, 100);
      }
    }
  }, [initialContent, updateContent, ytext, ensureLinkStyling]);

  // Ensure link styling is maintained
  useEffect(() => {
    if (editorRef.current) {
      ensureLinkStyling();
    }
  }, [ensureLinkStyling]);

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
    
    // Ensure links are styled after any formatting command
    setTimeout(() => {
      ensureLinkStyling();
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
