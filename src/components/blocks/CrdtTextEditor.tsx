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
  const [isEditMode, setIsEditMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [currentLink, setCurrentLink] = useState<{ url: string; text: string } | null>(null);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const isUpdatingRef = useRef(false);
  const lastKnownContentRef = useRef<string>('');

  const { ytext, isConnected, updateContent, getDocumentContent } = useYjsDocument({
    pageId: `${pageId}-${blockId}`,
    onContentChange: (content) => {
      if (!isUpdatingRef.current) {
        const htmlContent = content.text || '';
        console.log('CRDT content changed externally:', htmlContent);
        
        // Update the editor display if content changed externally
        if (editorRef.current && editorRef.current.innerHTML !== htmlContent) {
          console.log('Updating editor display with external content');
          isUpdatingRef.current = true;
          editorRef.current.innerHTML = htmlContent;
          lastKnownContentRef.current = htmlContent;
          isUpdatingRef.current = false;
        }
        
        // Notify parent component
        onContentChange({ text: htmlContent });
      }
    },
  });

  // Initialize Y.js document with initial content
  useEffect(() => {
    if (initialContent && ytext.length === 0) {
      console.log('Initializing Y.js with content:', initialContent);
      lastKnownContentRef.current = initialContent;
      updateContent(initialContent);
      
      // Also set the editor content if it's empty
      if (editorRef.current && !editorRef.current.innerHTML) {
        editorRef.current.innerHTML = initialContent;
      }
    }
  }, [initialContent, updateContent, ytext]);

  // Handle local text changes with improved HTML preservation
  const handleInput = () => {
    if (!editorRef.current || isUpdatingRef.current || !isEditMode) return;

    const htmlContent = editorRef.current.innerHTML || '';
    const currentContent = getDocumentContent();
    
    console.log('Input changed - HTML:', htmlContent, 'CRDT:', currentContent);
    
    // Only update if content actually changed
    if (htmlContent !== currentContent && htmlContent !== lastKnownContentRef.current) {
      console.log('Updating CRDT with new HTML content');
      isUpdatingRef.current = true;
      lastKnownContentRef.current = htmlContent;
      updateContent(htmlContent);
      isUpdatingRef.current = false;
    }
  };

  const handleDoubleClick = () => {
    console.log('Double click - entering edit mode');
    setIsEditMode(true);
    setIsFocused(true);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleFocus = () => {
    if (isEditMode) {
      setIsFocused(true);
    }
  };
  
  const handleBlur = () => {
    console.log('Blur - exiting edit mode, preserving content');
    setIsFocused(false);
    setIsEditMode(false);
    
    // Ensure final content is synced before exiting edit mode
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML || '';
      const currentContent = getDocumentContent();
      
      if (htmlContent !== currentContent) {
        console.log('Final sync on blur:', htmlContent);
        isUpdatingRef.current = true;
        lastKnownContentRef.current = htmlContent;
        updateContent(htmlContent);
        isUpdatingRef.current = false;
      }
    }
    
    // Small delay to allow toolbar clicks
    setTimeout(() => setShowToolbar(false), 150);
  };

  const handleMouseUp = () => {
    if (!isEditMode) return;
    
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

  // Handle clicks on links - only when not in edit mode
  const handleClick = (e: React.MouseEvent) => {
    // If we're in edit mode, don't handle link clicks
    if (isEditMode) return;
    
    const target = e.target as HTMLElement;
    const linkElement = target.closest('a');
    
    if (linkElement && linkElement.href) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Link clicked:', linkElement.href);
      
      // Open link in new tab
      window.open(linkElement.href, '_blank', 'noopener,noreferrer');
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

  const syncContentToYjs = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML || '';
      console.log('Syncing content to Y.js:', htmlContent);
      isUpdatingRef.current = true;
      lastKnownContentRef.current = htmlContent;
      updateContent(htmlContent);
      isUpdatingRef.current = false;
    }
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
    
    // Sync content after formatting
    setTimeout(syncContentToYjs, 100);
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

  const handleCreateLink = () => {
    if (!isEditMode) return;
    
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
    if (!isEditMode || !editorRef.current) return;
    
    console.log('Saving link:', { url, text });
    
    // Ensure we have a proper URL format
    let formattedUrl = url;
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
      formattedUrl = 'https://' + url;
    }

    // Use a more direct approach to insert the link
    const linkText = text.trim() || formattedUrl;
    const linkHTML = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    
    // Restore selection first
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        
        // Get the range and delete the selected content
        const range = selection.getRangeAt(0);
        range.deleteContents(); // ✅ Now calling deleteContents on Range, not Selection
        
        // Create a document fragment with the link
        const fragment = range.createContextualFragment(linkHTML);
        range.insertNode(fragment);
        
        // Move cursor after the link
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // If no saved selection, insert at current cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const fragment = range.createContextualFragment(linkHTML);
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // Clear saved selection
    setSavedSelection(null);
    
    // Focus back to editor
    editorRef.current.focus();
    
    // Force immediate sync to Y.js
    console.log('Forcing immediate sync after link creation');
    const finalContent = editorRef.current.innerHTML;
    console.log('Final content after link:', finalContent);
    
    // Update Y.js document immediately
    isUpdatingRef.current = true;
    lastKnownContentRef.current = finalContent;
    updateContent(finalContent);
    isUpdatingRef.current = false;
  };

  const handleRemoveLink = () => {
    if (!isEditMode) return;
    
    // Restore selection first
    restoreSelection();
    
    document.execCommand('unlink', false);
    
    // Clear saved selection
    setSavedSelection(null);
    
    editorRef.current?.focus();
    
    // Sync content after removing link
    setTimeout(syncContentToYjs, 100);
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

  return (
    <div className={`relative ${className}`}>
      <div
        ref={editorRef}
        contentEditable={isEditMode}
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseUp={handleMouseUp}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
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
      {isEditMode && isFocused && (
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
