
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { usePerformantAnimation } from "@/hooks/usePerformantAnimation";

interface PerformantAnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function PerformantAnimatedModal({
  isOpen,
  onClose,
  children,
  className,
}: PerformantAnimatedModalProps) {
  const { elementRef: overlayRef, toggleVisibility: toggleOverlay } = usePerformantAnimation();
  const { elementRef: contentRef, scale } = usePerformantAnimation();
  const [shouldRender, setShouldRender] = React.useState(isOpen);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        toggleOverlay(true, { duration: 300 });
        scale(true, { duration: 300 });
      });
    } else {
      toggleOverlay(false, {
        duration: 300,
        onComplete: () => setShouldRender(false)
      });
      scale(false, { duration: 300 });
    }
  }, [isOpen, toggleOverlay, scale]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={cn(
          "modal-overlay-animate hw-accelerated",
          "fixed inset-0 bg-black/50 backdrop-blur-sm"
        )}
        onClick={onClose}
      />

      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={contentRef}
          className={cn(
            "modal-content-animate hw-accelerated",
            "bg-background border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
