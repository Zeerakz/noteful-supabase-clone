
import React, { useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckboxPropertyConfig } from '@/types/property/configs/checkbox';
import { DatabaseField } from '@/types/database';

interface CheckboxFieldEditorProps {
  value: string;
  config: CheckboxPropertyConfig;
  onChange: (value: string) => void;
  field: DatabaseField;
  workspaceId: string;
  pageId?: string;
}

export function CheckboxFieldEditor({
  value,
  config,
  onChange,
  field,
  workspaceId,
  pageId
}: CheckboxFieldEditorProps) {
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const isChecked = value === 'true';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement === checkboxRef.current) {
        e.preventDefault();
        handleToggle();
      }
    };

    if (checkboxRef.current) {
      checkboxRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (checkboxRef.current) {
        checkboxRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isChecked]);

  const handleToggle = () => {
    const newValue = isChecked ? 'false' : 'true';
    onChange(newValue);
  };

  const handleCheckedChange = (checked: boolean) => {
    onChange(checked ? 'true' : 'false');
  };

  return (
    <div className="flex items-center justify-center">
      <Checkbox
        ref={checkboxRef}
        checked={isChecked}
        onCheckedChange={handleCheckedChange}
        className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label={`Toggle ${field.name}`}
        tabIndex={0}
      />
    </div>
  );
}
