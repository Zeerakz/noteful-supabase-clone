
import * as React from "react";
import { cn } from "@/lib/utils";
import { usePerformantAnimation } from "@/hooks/usePerformantAnimation";

interface PerformantAnimatedSidebarProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function PerformantAnimatedSidebar({
  children,
  isCollapsed,
  onToggle,
  className,
}: PerformantAnimatedSidebarProps) {
  const { elementRef, slideHorizontal } = usePerformantAnimation<HTMLDivElement>();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    slideHorizontal('left', !isCollapsed, {
      duration: 300,
      onComplete: () => {
        // Animation completed
        if (contentRef.current) {
          contentRef.current.classList.toggle('sidebar-content-visible', !isCollapsed);
          contentRef.current.classList.toggle('sidebar-content-hidden', isCollapsed);
        }
      }
    });
  }, [isCollapsed, slideHorizontal]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "sidebar-animate hw-accelerated",
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40",
        "w-64", // Fixed width when expanded
        className
      )}
    >
      <div
        ref={contentRef}
        className="sidebar-content-animate h-full overflow-hidden"
      >
        {children}
      </div>
      
      {/* Toggle button with hardware-accelerated animation */}
      <button
        onClick={onToggle}
        className={cn(
          "button-animate hw-accelerated",
          "absolute -right-3 top-4 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full",
          "flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            isCollapsed ? "rotate-0" : "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
