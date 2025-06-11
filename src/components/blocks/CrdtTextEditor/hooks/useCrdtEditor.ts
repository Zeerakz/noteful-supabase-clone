
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
          isUpdatingRef.current = false;
        }
        
        // Notify parent component
        onContentChange({ text: htmlContent });
      }
    },
  });

  const syncContentToYjs = useCallback(() => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML || '';
      console.log('Syncing content to Y.js:', htmlContent);
      isUpdatingRef.current = true;
      lastKnownContentRef.current = htmlContent;
      updateContent(htmlContent);
      isUpdatingRef.current = false;
    }
  }, [updateContent]);

  const handleInput = useCallback(() => {
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
  }, [isEditMode, getDocumentContent, updateContent]);

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
      
      if (htmlContent !== currentContent) {
        console.log('Final sync on blur:', htmlContent);
        isUpdatingRef.current = true;
        lastKnownContentRef.current = htmlContent;
        updateContent(htmlContent);
        isUpdatingRef.current = false;
      }
    }
  }, [getDocumentContent, updateContent]);

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
    handleInput,
    handleDoubleClick,
    handleFocus,
    handleBlur,
    handleClick,
    isUpdatingRef,
    lastKnownContentRef,
  };
}
