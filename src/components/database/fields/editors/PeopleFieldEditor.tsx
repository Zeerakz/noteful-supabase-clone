
import React from 'react';

interface PeopleFieldEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PeopleFieldEditor({ value, onChange }: PeopleFieldEditorProps) {
  // A proper people picker would be needed for a better UX.
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 bg-transparent border-none outline-none text-foreground"
      placeholder='Edit as JSON: [{"id": "...", "name": "..."}]'
      autoFocus
    />
  );
}
