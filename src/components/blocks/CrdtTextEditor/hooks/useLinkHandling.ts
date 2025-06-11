
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
    
    // Restore selection if we have one
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        console.log('Selection restored for link creation');
      }
    }

    // Create the link using document.execCommand for better browser compatibility
    try {
      // If we have selected text, use execCommand to create the link
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // If no text is selected but we have link text, insert it first
        if (range.collapsed && linkText) {
          range.insertNode(document.createTextNode(linkText));
          range.selectNode(range.startContainer.lastChild || range.startContainer);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        // Create the link using execCommand
        document.execCommand('createLink', false, formattedUrl);
        
        // Find the newly created link and apply additional attributes
        const links = editorRef.current.querySelectorAll('a[href="' + formattedUrl + '"]');
        const newLink = links[links.length - 1] as HTMLAnchorElement;
        
        if (newLink) {
          newLink.target = '_blank';
          newLink.rel = 'noopener noreferrer';
          newLink.style.color = '#2563eb';
          newLink.style.textDecoration = 'underline';
          newLink.style.cursor = 'pointer';
          
          // Update text content if different
          if (linkText && newLink.textContent !== linkText) {
            newLink.textContent = linkText;
          }
          
          console.log('Link created successfully:', newLink);
          
          // Move cursor after the link
          const afterRange = document.createRange();
          afterRange.setStartAfter(newLink);
          afterRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(afterRange);
        }
      }
    } catch (error) {
      console.error('Error creating link with execCommand:', error);
      
      // Fallback: manual link creation
      const linkElement = document.createElement('a');
      linkElement.href = formattedUrl;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      linkElement.textContent = linkText;
      linkElement.style.color = '#2563eb';
      linkElement.style.textDecoration = 'underline';
      linkElement.style.cursor = 'pointer';

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(linkElement);
        
        // Move cursor after the link
        range.setStartAfter(linkElement);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // Clear saved selection
    setSavedSelection(null);
    
    // Force content sync with a longer delay to ensure DOM is updated
    setTimeout(() => {
      console.log('Syncing content after link creation');
      syncContentToYjs();
      
      // Trigger a content change event to ensure the parent component is notified
      const event = new Event('input', { bubbles: true });
      editorRef.current?.dispatchEvent(event);
    }, 300);
  }, [isEditMode, editorRef, savedSelection, syncContentToYjs]);

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
