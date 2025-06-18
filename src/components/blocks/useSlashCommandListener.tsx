
import { useEffect } from 'react';

interface UseSlashCommandListenerProps {
  isEditable: boolean;
  openSlashMenu: (element: HTMLElement, term?: string) => void;
  closeSlashMenu: () => void;
  updateSearchTerm: (term: string) => void;
}

export function useSlashCommandListener({
  isEditable,
  openSlashMenu,
  closeSlashMenu,
  updateSearchTerm,
}: UseSlashCommandListenerProps) {
  useEffect(() => {
    if (!isEditable) return;

    let isTrackingSlash = false;
    let slashPosition = 0;
    let currentElement: HTMLElement | null = null;

    const getSelectionStart = (element: HTMLElement): number => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        return element.selectionStart || 0;
      }
      // For contentEditable elements, we'll use 0 as a fallback
      return 0;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if we're in an editable element
      if (!target || !(target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (event.key === '/') {
        // Start tracking for slash commands
        isTrackingSlash = true;
        slashPosition = getSelectionStart(target);
        currentElement = target;
        
        // Small delay to let the '/' character be inserted
        setTimeout(() => {
          if (currentElement) {
            openSlashMenu(currentElement, '');
          }
        }, 50);
      } else if (isTrackingSlash && currentElement) {
        if (event.key === 'Escape') {
          isTrackingSlash = false;
          closeSlashMenu();
        } else if (event.key === 'Enter' || event.key === 'Tab') {
          // Don't interfere with menu navigation
          return;
        } else if (event.key === 'Backspace') {
          // Check if we're deleting the slash
          const currentPos = getSelectionStart(currentElement);
          if (currentPos <= slashPosition) {
            isTrackingSlash = false;
            closeSlashMenu();
          }
        } else if (event.key.length === 1) {
          // Update search term as user types
          setTimeout(() => {
            if (currentElement && isTrackingSlash) {
              const text = currentElement.textContent || '';
              const slashIndex = text.lastIndexOf('/');
              if (slashIndex !== -1) {
                const term = text.substring(slashIndex + 1);
                updateSearchTerm(term);
              }
            }
          }, 10);
        }
      }
    };

    const handleInput = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (isTrackingSlash && currentElement === target) {
        const text = target.textContent || '';
        const slashIndex = text.lastIndexOf('/');
        
        if (slashIndex === -1) {
          // Slash was removed
          isTrackingSlash = false;
          closeSlashMenu();
        } else {
          const term = text.substring(slashIndex + 1);
          updateSearchTerm(term);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('input', handleInput);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('input', handleInput);
    };
  }, [isEditable, openSlashMenu, closeSlashMenu, updateSearchTerm]);
}
