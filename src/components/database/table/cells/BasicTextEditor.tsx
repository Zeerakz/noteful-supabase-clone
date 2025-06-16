
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BasicTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  multiline?: boolean;
}

export function BasicTextEditor({
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  className,
  multiline = false
}: BasicTextEditorProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <InputComponent
      ref={inputRef as any}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={cn(
        "w-full h-full outline-none resize-none px-2 py-1",
        "text-sm font-normal text-foreground leading-relaxed",
        "tracking-normal bg-transparent border-none",
        className
      )}
      style={{ 
        minHeight: multiline ? '60px' : 'auto',
        fontFamily: 'inherit'
      }}
    />
  );
}
