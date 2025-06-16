
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CellContainerProps {
  children?: React.ReactNode;
  isEditing: boolean;
  onClick?: () => void;
  onBlur?: (e: React.FocusEvent) => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
}

export function CellContainer({
  children,
  isEditing,
  onClick,
  onBlur,
  onFocus,
  onKeyDown,
  className,
  placeholder = "Empty",
  disabled = false,
  value
}: CellContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full px-2 py-1",
          "text-sm font-normal text-foreground leading-relaxed",
          "tracking-normal bg-transparent",
          className
        )}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full h-full cursor-text select-text px-2 py-1 rounded-sm",
        "text-sm font-normal text-foreground leading-relaxed",
        "hover:bg-muted/30 transition-colors",
        "border-none outline-none tracking-normal",
        // Empty state styling
        !value && "text-muted-foreground/60 italic",
        disabled && "cursor-default",
        className
      )}
      style={{ fontFamily: 'inherit' }}
    >
      {value || placeholder}
    </div>
  );
}
