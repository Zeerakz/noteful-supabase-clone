
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
