
import React from 'react';

interface BasicInputFieldEditorProps {
  type: 'text' | 'number' | 'email' | 'phone' | 'url';
  value: string;
  onChange: (value: string) => void;
}

export function BasicInputFieldEditor({ type, value, onChange }: BasicInputFieldEditorProps) {
  const inputType = type === 'number' ? 'number' : type === 'email' ? 'email' : 'text';
  return (
    <input
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 bg-transparent border-none outline-none text-foreground"
      autoFocus
    />
  );
}
