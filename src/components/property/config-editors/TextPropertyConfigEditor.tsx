
import React from 'react';
import { TextPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface TextPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: TextPropertyConfig) => void;
}

export function TextPropertyConfigEditor({ config, onConfigChange }: TextPropertyConfigEditorProps) {
  const textConfig = config as TextPropertyConfig;

  const updateConfig = (updates: Partial<TextPropertyConfig>) => {
    onConfigChange({ ...textConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          value={textConfig.placeholder || ''}
          onChange={(e) => updateConfig({ placeholder: e.target.value })}
          placeholder="Enter placeholder text"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Value</Label>
        <Input
          id="defaultValue"
          value={textConfig.defaultValue || ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value })}
          placeholder="Enter default value"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minLength">Minimum Length</Label>
          <Input
            id="minLength"
            type="number"
            min="0"
            value={textConfig.minLength || ''}
            onChange={(e) => updateConfig({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxLength">Maximum Length</Label>
          <Input
            id="maxLength"
            type="number"
            min="1"
            value={textConfig.maxLength || ''}
            onChange={(e) => updateConfig({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="multiline"
          checked={textConfig.multiline || false}
          onCheckedChange={(checked) => updateConfig({ multiline: checked as boolean })}
        />
        <Label htmlFor="multiline">Allow multiline text</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={textConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={textConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
