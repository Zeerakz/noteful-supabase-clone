
import { useState, useRef, useCallback } from 'react';
import { LinkData } from '../types';

export function useLinkHandling(
  isEditMode: boolean,
  editorRef: React.RefObject<HTMLDivElement>,
  syncContentToYjs: () => void
) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [currentLink, setCurrentLink] = useState<LinkData | null>(null);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }
  }, [savedSelection]);

  const handleCreateLink = useCallback(() => {
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
  }, [isEditMode, editorRef, saveSelection]);

  const handleSaveLink = useCallback((url: string, text: string) => {
    if (!isEditMode || !editorRef.current) return;
    
    console.log('Saving link:', { url, text });
    
    // Ensure we have a proper URL format
    let formattedUrl = url;
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
      formattedUrl = 'https://' + url;
    }

    const linkText = text.trim() || formattedUrl;
    
    // Create the link element directly
    const linkElement = document.createElement('a');
    linkElement.href = formattedUrl;
    linkElement.target = '_blank';
    linkElement.rel = 'noopener noreferrer';
    linkElement.textContent = linkText;
    
    // Apply link styles immediately
    linkElement.style.color = '#2563eb';
    linkElement.style.textDecoration = 'underline';
    linkElement.style.cursor = 'pointer';

    // Restore selection and insert the link
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        
        // Delete the selected content
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Insert the link element
        range.insertNode(linkElement);
        
        // Move cursor after the link
        range.setStartAfter(linkElement);
        range.setEndAfter(linkElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // If no saved selection, insert at current cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(linkElement);
        
        // Move cursor after the link
        range.setStartAfter(linkElement);
        range.setEndAfter(linkElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // Clear saved selection
    setSavedSelection(null);
    
    // Focus back to editor
    editorRef.current.focus();
    
    // Delay sync to ensure DOM is updated first
    setTimeout(() => {
      console.log('Syncing content after link creation');
      syncContentToYjs();
    }, 200);
  }, [isEditMode, editorRef, savedSelection, syncContentToYjs]);

  const handleRemoveLink = useCallback(() => {
    if (!isEditMode) return;
    
    // Restore selection first
    restoreSelection();
    
    document.execCommand('unlink', false);
    
    // Clear saved selection
    setSavedSelection(null);
    
    editorRef.current?.focus();
    
    // Sync content after removing link
    setTimeout(syncContentToYjs, 100);
  }, [isEditMode, editorRef, restoreSelection, syncContentToYjs]);

  return {
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    selectedText,
    currentLink,
    handleCreateLink,
    handleSaveLink,
    handleRemoveLink,
    setSavedSelection,
  };
}
