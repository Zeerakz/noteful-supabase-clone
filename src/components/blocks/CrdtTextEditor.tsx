import React, { useEffect, useRef, useState } from 'react';
import { useYjsDocument } from '@/hooks/useYjsDocument';
import { EditorToolbar } from './RichTextEditor/EditorToolbar';
import { LinkDialog } from './RichTextEditor/LinkDialog';
import { CommentIcon } from './CommentIcon';
import { Comment } from '@/hooks/useComments';

interface CrdtTextEditorProps {
  pageId: string;
  blockId: string;
  initialContent?: string;
  onContentChange: (content: any) => void;
  placeholder?: string;
  className?: string;
  showCommentButton?: boolean;
  comments?: Comment[];
  onOpenComments?: () => void;
}

export function CrdtTextEditor({
  pageId,
  blockId,
  initialContent = '',
  onContentChange,
  placeholder = 'Start typing...',
  className = '',
  showCommentButton = false,
  comments = [],
  onOpenComments,
}: CrdtTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [currentLink, setCurrentLink] = useState<{ url: string; text: string } | null>(null);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [hasError, setHasError] = useState(false);
  const isUpdatingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTemporaryBlockRef = useRef(blockId.startsWith('temp-'));

  // Update temporary block status when blockId changes
  useEffect(() => {
    isTemporaryBlockRef.current = blockId.startsWith('temp-');
    console.log('CrdtTextEditor: Block ID changed, isTemporary:', isTemporaryBlockRef.current, blockId);
  }, [blockId]);

  const { ytext, isConnected, updateContent, getDocumentContent } = useYjsDocument({
    pageId: `${pageId}-${blockId}`,
    onContentChange: (content) => {
      if (!isUpdatingRef.current && content !== lastSavedContent && !isTemporaryBlockRef.current) {
        console.log('Y.js content changed, scheduling save:', content);
        
        // Clear any existing save timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Debounce saves to prevent too frequent updates
        saveTimeoutRef.current = setTimeout(() => {
          if (!isTemporaryBlockRef.current) {
            try {
              onContentChange({ text: content });
              setLastSavedContent(content);
              setHasError(false);
            } catch (error) {
              console.error('Error saving content via Y.js:', error);
              setHasError(true);
            }
          }
        }, 300);
        
        // Update editor display if needed
        if (editorRef.current && editorRef.current.innerHTML !== content) {
          isUpdatingRef.current = true;
          editorRef.current.innerHTML = content;
          isUpdatingRef.current = false;
        }
      }
    },
  });

  // Initialize with content
  useEffect(() => {
    if (initialContent && editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
      setLastSavedContent(initialContent);
      
      if (ytext.length === 0) {
        updateContent(initialContent);
      }
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

  // Simplified save function with temporary block protection
  const saveContent = async () => {
    if (!editorRef.current || isTemporaryBlockRef.current) {
      console.log('CrdtTextEditor: Skipping save - temporary block or no editor ref');
      return;
    }
    
    const content = editorRef.current.innerHTML || '';
    if (content === lastSavedContent) return;

    console.log('CrdtTextEditor: Saving content:', content);
    try {
      // Save via parent component
      await onContentChange({ text: content });
      
      // Update Y.js if different and connected
      if (isConnected && content !== getDocumentContent()) {
        isUpdatingRef.current = true;
        updateContent(content);
        isUpdatingRef.current = false;
      }
      
      setLastSavedContent(content);
      setHasError(false);
    } catch (error) {
      console.error('Error saving content:', error);
      setHasError(true);
    }
  };

  const handleInput = () => {
    if (isUpdatingRef.current) return;
    
    const content = editorRef.current?.innerHTML || '';
    
    // Update Y.js immediately for real-time collaboration (even for temporary blocks)
    if (isConnected && content !== getDocumentContent()) {
      isUpdatingRef.current = true;
      updateContent(content);
      isUpdatingRef.current = false;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    // Only save if not a temporary block
    if (!isTemporaryBlockRef.current) {
      saveContent();
    }
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

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const linkElement = target.closest('a');
    
    if (linkElement && linkElement.href) {
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().trim().length > 0;
      
      if (!hasSelection) {
        e.preventDefault();
        e.stopPropagation();
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
    handleInput();
  };

  const handleInlineCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString();
    if (selectedText) {
      const codeHTML = `<code>${selectedText}</code>`;
      document.execCommand('insertHTML', false, codeHTML);
    } else {
      const codeHTML = '<code></code>';
      document.execCommand('insertHTML', false, codeHTML);
      
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
    handleInput();
  };

  const handleCreateLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    setSavedSelection(range.cloneRange());
    
    let linkElement: HTMLAnchorElement | null = null;
    let currentElement = range.commonAncestorContainer;
    
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
      setCurrentLink({
        url: linkElement.href,
        text: linkElement.textContent || ''
      });
      setSelectedText(linkElement.textContent || '');
    } else {
      setCurrentLink(null);
      setSelectedText(selectedText);
    }
    
    setIsLinkDialogOpen(true);
  };

  const handleSaveLink = (url: string, text: string) => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }

    let formattedUrl = url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    if (currentLink) {
      const linkHTML = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      document.execCommand('insertHTML', false, linkHTML);
    } else {
      if (selectedText && selectedText.trim()) {
        const linkText = text.trim() || selectedText;
        const linkHTML = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        document.execCommand('insertHTML', false, linkHTML);
      } else {
        const linkText = text.trim() || formattedUrl;
        const linkHTML = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        document.execCommand('insertHTML', false, linkHTML);
      }
    }

    setSavedSelection(null);
    editorRef.current?.focus();
    
    setTimeout(() => {
      handleInput();
      if (!isTemporaryBlockRef.current) {
        saveContent();
      }
    }, 100);
  };

  const handleRemoveLink = () => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }
    
    document.execCommand('unlink', false);
    setSavedSelection(null);
    editorRef.current?.focus();
    
    setTimeout(() => {
      handleInput();
      if (!isTemporaryBlockRef.current) {
        saveContent();
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        case 's':
          e.preventDefault();
          if (!isTemporaryBlockRef.current) {
            saveContent();
          }
          break;
      }
    }
  };

  const handleCommentClick = () => {
    console.log('Comment button clicked for block:', blockId);
    if (onOpenComments) {
      onOpenComments();
    } else {
      console.warn('onOpenComments callback not provided');
    }
  };

  return (
    <div className={`relative group ${className}`}>
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
          w-full min-h-[2.5rem] p-2 rounded-md
          border border-transparent
          hover:border-input hover:bg-background/50
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:bg-background
          rich-text-content
          transition-all duration-200
          ${isFocused ? 'ring-2 ring-ring border-ring bg-background' : ''}
          ${hasError ? 'border-red-500' : ''}
          ${isTemporaryBlockRef.current ? 'opacity-70' : ''}
        `}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
        }}
      />
      
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
      
      {isFocused && (
        <div className="absolute bottom-1 right-1 flex items-center gap-1 z-10">
          {showCommentButton && (
            <CommentIcon
              hasComments={comments.length > 0}
              commentCount={comments.length}
              onClick={handleCommentClick}
              className="mr-1"
            />
          )}
          <div
            className={`w-2 h-2 rounded-full ${
              hasError ? 'bg-red-500' : 
              isTemporaryBlockRef.current ? 'bg-yellow-500' :
              isConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            title={
              hasError ? 'Save error' : 
              isTemporaryBlockRef.current ? 'Creating block...' :
              isConnected ? 'Connected (CRDT enabled)' : 'Disconnected'
            }
          />
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
