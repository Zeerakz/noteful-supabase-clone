
import React, { useState, useEffect, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { LinkDialog } from './LinkDialog';
import { useMarkdownShortcuts } from './hooks/useMarkdownShortcuts';
import { createEmptyDoc, renderToHTML, parseHTMLToJSON } from './utils/contentParser';
import { RichTextEditorProps } from './types';

export function RichTextEditor({ initialContent, onBlur, placeholder = "Start typing..." }: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent || createEmptyDoc());
  const editorRef = useRef<HTMLDivElement>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [currentLink, setCurrentLink] = useState<{ url: string; text: string } | null>(null);
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
    if (command === 'createLink') {
      handleCreateLink();
      return;
    }
    
    document.execCommand(command, false, value);
    editorRef.current?.focus();
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
      document.execCommand('createLink', false, url);
    } else {
      // Create new link
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

    editorRef.current?.focus();
    
    // Update content
    if (editorRef.current) {
      const newContent = parseHTMLToJSON(editorRef.current.innerHTML);
      setContent(newContent);
    }
  };

  const handleRemoveLink = () => {
    document.execCommand('unlink', false);
    editorRef.current?.focus();
    
    // Update content
    if (editorRef.current) {
      const newContent = parseHTMLToJSON(editorRef.current.innerHTML);
      setContent(newContent);
    }
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
        case 'k':
          e.preventDefault();
          handleCreateLink();
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
