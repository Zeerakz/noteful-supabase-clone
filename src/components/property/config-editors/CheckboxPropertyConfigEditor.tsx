
import React from 'react';
import { CheckboxPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface CheckboxPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: CheckboxPropertyConfig) => void;
}

export function CheckboxPropertyConfigEditor({ config, onConfigChange }: CheckboxPropertyConfigEditorProps) {
  const checkboxConfig = config as CheckboxPropertyConfig;

  const updateConfig = (updates: Partial<CheckboxPropertyConfig>) => {
    onConfigChange({ ...checkboxConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="trueLabel">Label for True/Checked State</Label>
        <Input
          id="trueLabel"
          value={checkboxConfig.trueLabel || ''}
          onChange={(e) => updateConfig({ trueLabel: e.target.value })}
          placeholder="e.g., Yes, Done, Completed"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="falseLabel">Label for False/Unchecked State</Label>
        <Input
          id="falseLabel"
          value={checkboxConfig.falseLabel || ''}
          onChange={(e) => updateConfig({ falseLabel: e.target.value })}
          placeholder="e.g., No, To Do, Incomplete"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="defaultValue"
          checked={checkboxConfig.defaultValue || false}
          onCheckedChange={(checked) => updateConfig({ defaultValue: checked as boolean })}
        />
        <Label htmlFor="defaultValue">Default to checked</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={checkboxConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={checkboxConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
