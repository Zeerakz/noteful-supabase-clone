
import React from 'react';
import { cn } from '@/lib/utils';

interface SkipToContentProps {
  targetId?: string;
  className?: string;
}

export function SkipToContent({ targetId = 'main-content', className }: SkipToContentProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Find the target element
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Move focus to the target element
      targetElement.focus();
      
      // If the element doesn't naturally receive focus, make it focusable temporarily
      if (!targetElement.getAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();
        
        // Remove the tabindex after a short delay to clean up
        setTimeout(() => {
          targetElement.removeAttribute('tabindex');
        }, 100);
      }
      
      // Scroll the element into view if needed
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Visually hidden by default
        "sr-only",
        // Visible when focused
        "focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "focus:z-50 focus:px-4 focus:py-2",
        "focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:font-medium",
        "focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring",
        "transition-all duration-200",
        className
      )}
    >
      Skip to main content
    </a>
  );
}
