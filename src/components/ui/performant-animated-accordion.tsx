
import * as React from "react";
import { cn } from "@/lib/utils";
import { usePerformantAnimation } from "@/hooks/usePerformantAnimation";

interface PerformantAnimatedAccordionProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

export function PerformantAnimatedAccordion({
  trigger,
  children,
  isExpanded,
  onToggle,
  className,
}: PerformantAnimatedAccordionProps) {
  const { elementRef, accordion } = usePerformantAnimation<HTMLDivElement>();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    accordion(isExpanded, {
      duration: 300,
      onComplete: () => {
        // Update content visibility after animation
        if (contentRef.current) {
          contentRef.current.classList.toggle('accordion-content-visible', isExpanded);
          contentRef.current.classList.toggle('accordion-content-hidden', !isExpanded);
        }
      }
    });
  }, [isExpanded, accordion]);

  return (
    <div className={cn("overflow-hidden", className)}>
      {/* Trigger button with hardware-accelerated hover */}
      <button
        onClick={onToggle}
        className={cn(
          "button-animate hw-accelerated",
          "w-full flex items-center justify-between p-3 text-left",
          "hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-expanded={isExpanded}
      >
        {trigger}
        <svg
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Animated content */}
      <div
        ref={elementRef}
        className="accordion-animate hw-accelerated"
        style={{ transformOrigin: 'top' }}
      >
        <div
          ref={contentRef}
          className="accordion-content-animate p-3 pt-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
