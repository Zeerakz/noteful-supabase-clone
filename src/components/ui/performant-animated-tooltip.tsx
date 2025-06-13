
import * as React from "react";
import { cn } from "@/lib/utils";
import { usePerformantAnimation } from "@/hooks/usePerformantAnimation";

interface PerformantAnimatedTooltipProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function PerformantAnimatedTooltip({
  trigger,
  content,
  side = 'top',
  className,
}: PerformantAnimatedTooltipProps) {
  const { elementRef, toggleVisibility } = usePerformantAnimation();
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const showTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(true);
    toggleVisibility(true, { duration: 200 });
  }, [toggleVisibility]);

  const hideTooltip = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      toggleVisibility(false, { duration: 200 });
    }, 100);
  }, [toggleVisibility]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipPosition = () => {
    switch (side) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {trigger}
      
      {isVisible && (
        <div
          ref={elementRef}
          className={cn(
            "tooltip-animate hw-accelerated",
            "absolute z-50 px-2 py-1 text-xs text-white bg-black rounded whitespace-nowrap",
            "pointer-events-none",
            getTooltipPosition(),
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
