
import React, { useEffect, useRef } from 'react';

interface KeyboardNavigationProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'grid';
  wrap?: boolean;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right', currentIndex: number) => void;
}

export function KeyboardNavigation({ 
  children, 
  orientation = 'vertical',
  wrap = true,
  onNavigate 
}: KeyboardNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = getFocusableElements(container);
      const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
      
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      let direction: 'up' | 'down' | 'left' | 'right' | null = null;

      switch (e.key) {
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'grid') {
            direction = 'up';
            nextIndex = currentIndex - 1;
            if (nextIndex < 0 && wrap) {
              nextIndex = focusableElements.length - 1;
            }
            e.preventDefault();
          }
          break;
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'grid') {
            direction = 'down';
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length && wrap) {
              nextIndex = 0;
            }
            e.preventDefault();
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'grid') {
            direction = 'left';
            nextIndex = currentIndex - 1;
            if (nextIndex < 0 && wrap) {
              nextIndex = focusableElements.length - 1;
            }
            e.preventDefault();
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'grid') {
            direction = 'right';
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length && wrap) {
              nextIndex = 0;
            }
            e.preventDefault();
          }
          break;
        case 'Home':
          nextIndex = 0;
          e.preventDefault();
          break;
        case 'End':
          nextIndex = focusableElements.length - 1;
          e.preventDefault();
          break;
      }

      if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < focusableElements.length) {
        focusableElements[nextIndex].focus();
        if (direction && onNavigate) {
          onNavigate(direction, nextIndex);
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [orientation, wrap, onNavigate]);

  return (
    <div 
      ref={containerRef} 
      className="keyboard-navigation"
      role="group"
      aria-label="Keyboard navigatable content"
    >
      {children}
    </div>
  );
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]:not([contenteditable="false"])',
    '[role="button"]:not([disabled])',
    '[role="checkbox"]:not([disabled])',
    '[role="menuitem"]:not([disabled])'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}
