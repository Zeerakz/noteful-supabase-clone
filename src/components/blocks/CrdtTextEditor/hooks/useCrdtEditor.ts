
import { useRef, useState, useCallback } from 'react';
import { useYjsDocument } from '@/hooks/useYjsDocument';

export function useCrdtEditor(
  pageId: string,
  blockId: string,
  initialContent: string,
  onContentChange: (content: any) => void
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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
          
          // Ensure links are properly styled after content update
          setTimeout(() => {
            ensureLinkStyling();
            isUpdatingRef.current = false;
          }, 100);
        }
        
        // Notify parent component
        onContentChange({ text: htmlContent });
      }
    },
  });

  const ensureLinkStyling = useCallback(() => {
    if (!editorRef.current) return;
    
    const links = editorRef.current.querySelectorAll('a');
    console.log('Ensuring link styling for', links.length, 'links');
    
    links.forEach((link, index) => {
      console.log(`Styling link ${index + 1}:`, link.href, link.textContent);
      
      // Force inline styles to override any CSS conflicts
      link.style.setProperty('color', '#2563eb', 'important');
      link.style.setProperty('text-decoration', 'underline', 'important');
      link.style.setProperty('cursor', 'pointer', 'important');
      link.style.setProperty('pointer-events', 'auto', 'important');
      link.style.setProperty('display', 'inline', 'important');
      link.style.setProperty('position', 'relative', 'important');
      link.style.setProperty('z-index', '1', 'important');
      
      // Ensure proper attributes
      if (!link.target) link.target = '_blank';
      if (!link.rel) link.rel = 'noopener noreferrer';
      
      // Add a class for easier targeting
      link.classList.add('rich-text-link');
      
      console.log('Link styled with color:', link.style.color);
    });
  }, []);

  const syncContentToYjs = useCallback(() => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML || '';
      console.log('Syncing content to Y.js:', htmlContent);
      
      // Ensure links are properly styled before syncing
      ensureLinkStyling();
      
      isUpdatingRef.current = true;
      lastKnownContentRef.current = htmlContent;
      updateContent(htmlContent);
      
      // Re-apply styling after a brief delay to ensure it sticks
      setTimeout(() => {
        ensureLinkStyling();
        isUpdatingRef.current = false;
      }, 150);
    }
  }, [updateContent, ensureLinkStyling]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isUpdatingRef.current || !isEditMode) return;

    const htmlContent = editorRef.current.innerHTML || '';
    const currentContent = getDocumentContent();
    
    console.log('Input changed - HTML:', htmlContent, 'CRDT:', currentContent);
    
    // Ensure links are styled after input
    setTimeout(ensureLinkStyling, 50);
    
    // Only update if content actually changed
    if (htmlContent !== currentContent && htmlContent !== lastKnownContentRef.current) {
      console.log('Updating CRDT with new HTML content');
      isUpdatingRef.current = true;
      lastKnownContentRef.current = htmlContent;
      updateContent(htmlContent);
      
      // Re-apply styling after sync
      setTimeout(() => {
        ensureLinkStyling();
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [isEditMode, getDocumentContent, updateContent, ensureLinkStyling]);

  const handleDoubleClick = useCallback(() => {
    console.log('Double click - entering edit mode');
    setIsEditMode(true);
    setIsFocused(true);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (isEditMode) {
      setIsFocused(true);
    }
  }, [isEditMode]);

  const handleBlur = useCallback(() => {
    console.log('Blur - exiting edit mode, preserving content');
    setIsFocused(false);
    setIsEditMode(false);
    
    // Ensure final content is synced before exiting edit mode
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML || '';
      const currentContent = getDocumentContent();
      
      // Ensure links are properly styled before final sync
      ensureLinkStyling();
      
      if (htmlContent !== currentContent) {
        console.log('Final sync on blur:', htmlContent);
        isUpdatingRef.current = true;
        lastKnownContentRef.current = htmlContent;
        updateContent(htmlContent);
        
        // Final styling application
        setTimeout(() => {
          ensureLinkStyling();
          isUpdatingRef.current = false;
        }, 100);
      }
    }
  }, [getDocumentContent, updateContent, ensureLinkStyling]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const linkElement = target.closest('a');
    
    // If we click on a link, handle it appropriately based on edit mode
    if (linkElement && linkElement.href) {
      if (isEditMode) {
        // In edit mode, allow link editing but prevent navigation
        console.log('Link clicked in edit mode - allowing editing');
        return;
      } else {
        // In view mode, open the link
        e.preventDefault();
        e.stopPropagation();
        console.log('Link clicked in view mode:', linkElement.href);
        window.open(linkElement.href, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    
    // If not a link click and not in edit mode, this could start edit mode
    if (!isEditMode) {
      // Don't automatically enter edit mode on single click
      // User should double-click to edit
      return;
    }
  }, [isEditMode]);

  return {
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
    isUpdatingRef,
    lastKnownContentRef,
  };
}
