
import * as React from "react";
import { createPortal } from "react-dom";
import { X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerformantAnimation } from "@/hooks/usePerformantAnimation";
import { Button } from "@/components/ui/button";

interface MobileNavigationDrawerProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function MobileNavigationDrawer({
  children,
  isOpen,
  onOpenChange,
  className,
}: MobileNavigationDrawerProps) {
  const { elementRef: scrimRef, toggleVisibility: toggleScrim } = usePerformantAnimation<HTMLDivElement>();
  const { elementRef: drawerRef, slideHorizontal } = usePerformantAnimation<HTMLDivElement>();
  const [shouldRender, setShouldRender] = React.useState(isOpen);
  const startX = React.useRef<number>(0);
  const currentX = React.useRef<number>(0);
  const isDragging = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        toggleScrim(true, { duration: 300 });
        slideHorizontal('left', true, { duration: 300 });
      });
    } else {
      toggleScrim(false, { duration: 300 });
      slideHorizontal('left', false, {
        duration: 300,
        onComplete: () => setShouldRender(false)
      });
    }
  }, [isOpen, toggleScrim, slideHorizontal]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onOpenChange]);

  // Handle touch events for swipe-to-close
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    isDragging.current = true;
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // Only allow left swipe (negative delta) to close
    if (deltaX < 0 && drawerRef.current) {
      const progress = Math.min(Math.abs(deltaX) / 200, 1);
      drawerRef.current.style.transform = `translateX(${deltaX}px)`;
      
      if (scrimRef.current) {
        scrimRef.current.style.opacity = `${1 - progress * 0.5}`;
      }
    }
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    if (!isDragging.current) return;
    
    const deltaX = currentX.current - startX.current;
    
    // Close drawer if swiped left more than 100px
    if (deltaX < -100) {
      onOpenChange(false);
    } else {
      // Reset position
      if (drawerRef.current) {
        drawerRef.current.style.transform = '';
      }
      if (scrimRef.current) {
        scrimRef.current.style.opacity = '';
      }
    }
    
    isDragging.current = false;
  }, [onOpenChange]);

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Scrim */}
      <div
        ref={scrimRef}
        className={cn(
          "modal-overlay-animate hw-accelerated",
          "fixed inset-0 bg-black/50 backdrop-blur-sm"
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "slide-animate hw-accelerated",
          "fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-sidebar border-r border-sidebar-border",
          "flex flex-col overflow-hidden",
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Navigation</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Hamburger toggle button component
interface MobileNavigationToggleProps {
  onToggle: () => void;
  className?: string;
}

export function MobileNavigationToggle({ onToggle, className }: MobileNavigationToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        "md:hidden h-8 w-8 text-foreground hover:bg-accent",
        className
      )}
      aria-label="Open navigation menu"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}
