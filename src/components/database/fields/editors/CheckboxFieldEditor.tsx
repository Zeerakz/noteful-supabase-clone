
import React from 'react';

interface CheckboxFieldEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CheckboxFieldEditor({ value, onChange }: CheckboxFieldEditorProps) {
  return (
    <input
      type="checkbox"
      checked={value === 'true'}
      onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
      className="rounded"
      autoFocus
    />
  );
}
