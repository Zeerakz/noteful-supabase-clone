
import * as React from "react";
import { cn } from "@/lib/utils";
import { usePerformantAnimation } from "@/hooks/usePerformantAnimation";

interface PerformantAnimatedMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function PerformantAnimatedMenuItem({
  children,
  onClick,
  isActive = false,
  className,
  icon,
}: PerformantAnimatedMenuItemProps) {
  const { elementRef, applyHoverAnimation } = usePerformantAnimation<HTMLButtonElement>();

  React.useEffect(() => {
    const cleanup = applyHoverAnimation('menu-item');
    return cleanup;
  }, [applyHoverAnimation]);

  React.useEffect(() => {
    // Apply active state with hardware acceleration
    if (elementRef.current) {
      elementRef.current.classList.toggle('menu-item-active', isActive);
    }
  }, [isActive]);

  return (
    <button
      ref={elementRef}
      onClick={onClick}
      className={cn(
        "menu-item-animate hw-accelerated",
        "w-full flex items-center gap-3 px-3 py-2 text-left text-sm",
        "text-sidebar-foreground bg-transparent rounded-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        className
      )}
    >
      {icon && (
        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}
