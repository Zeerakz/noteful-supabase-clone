
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
      const range = selection.getRangeAt(0);
      setSavedSelection(range.cloneRange());
      console.log('Selection saved:', range.toString());
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        console.log('Selection restored:', savedSelection.toString());
      }
    }
  }, [savedSelection]);

  const applyLinkStyling = useCallback((linkElement: HTMLAnchorElement) => {
    // Apply comprehensive styling to ensure visibility
    linkElement.style.setProperty('color', '#2563eb', 'important');
    linkElement.style.setProperty('text-decoration', 'underline', 'important');
    linkElement.style.setProperty('cursor', 'pointer', 'important');
    linkElement.style.setProperty('pointer-events', 'auto', 'important');
    linkElement.style.setProperty('display', 'inline', 'important');
    linkElement.style.setProperty('position', 'relative', 'important');
    linkElement.style.setProperty('z-index', '1', 'important');
    linkElement.style.setProperty('background', 'transparent', 'important');
    linkElement.style.setProperty('border', 'none', 'important');
    linkElement.style.setProperty('outline', 'none', 'important');
    linkElement.classList.add('rich-text-link');
    
    console.log('Applied styling to link:', linkElement.href, 'with color:', linkElement.style.color);
  }, []);

  const handleCreateLink = useCallback(() => {
    if (!isEditMode) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    console.log('Creating link for selection:', selectedText);
    
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
      console.log('Editing existing link:', linkElement.href);
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
      console.log('Creating new link for text:', selectedText);
      setCurrentLink(null);
      setSelectedText(selectedText);
    }
    
    setIsLinkDialogOpen(true);
  }, [isEditMode, editorRef, saveSelection]);

  const handleSaveLink = useCallback((url: string, text: string) => {
    if (!isEditMode || !editorRef.current) return;
    
    console.log('Saving link:', { url, text, hasSelection: !!savedSelection });
    
    // Ensure we have a proper URL format
    let formattedUrl = url.trim();
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://') && !formattedUrl.startsWith('mailto:')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const linkText = text.trim() || formattedUrl;
    console.log('Formatted URL:', formattedUrl, 'Link text:', linkText);
    
    // Focus the editor first to ensure proper selection handling
    editorRef.current.focus();
    
    try {
      // Restore selection if we have one
      if (savedSelection) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(savedSelection);
          console.log('Selection restored for link creation');
        }
      }

      // Create the link element manually for better control
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Create the link element
        const linkElement = document.createElement('a');
        linkElement.href = formattedUrl;
        linkElement.target = '_blank';
        linkElement.rel = 'noopener noreferrer';
        linkElement.textContent = linkText;
        
        // Apply comprehensive styling immediately
        applyLinkStyling(linkElement);
        
        // Clear the range and insert the link
        range.deleteContents();
        range.insertNode(linkElement);
        
        console.log('Link element created and inserted:', linkElement.outerHTML);
        
        // Move cursor after the link
        const afterRange = document.createRange();
        afterRange.setStartAfter(linkElement);
        afterRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(afterRange);
        
        // Trigger input event to ensure content is synced
        const inputEvent = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(inputEvent);
        
        // Force multiple styling applications to ensure it sticks
        setTimeout(() => applyLinkStyling(linkElement), 10);
        setTimeout(() => applyLinkStyling(linkElement), 50);
        setTimeout(() => applyLinkStyling(linkElement), 100);
        setTimeout(() => applyLinkStyling(linkElement), 200);
      }
    } catch (error) {
      console.error('Error creating link manually:', error);
    }

    // Clear saved selection
    setSavedSelection(null);
    
    // Force content sync with multiple delays to ensure persistence
    setTimeout(() => {
      console.log('First sync after link creation');
      syncContentToYjs();
    }, 100);
    
    setTimeout(() => {
      console.log('Second sync after link creation');
      syncContentToYjs();
    }, 300);

    setTimeout(() => {
      console.log('Third sync after link creation');
      syncContentToYjs();
    }, 500);
  }, [isEditMode, editorRef, savedSelection, syncContentToYjs, applyLinkStyling]);

  const handleRemoveLink = useCallback(() => {
    if (!isEditMode || !editorRef.current) return;
    
    console.log('Removing link');
    
    // Restore selection first
    if (savedSelection) {
      restoreSelection();
    }
    
    // Use execCommand to unlink
    document.execCommand('unlink', false);
    
    // Clear saved selection
    setSavedSelection(null);
    
    editorRef.current.focus();
    
    // Sync content after removing link
    setTimeout(() => {
      console.log('Syncing content after link removal');
      syncContentToYjs();
    }, 100);
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
