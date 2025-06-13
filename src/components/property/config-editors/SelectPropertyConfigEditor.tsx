
import React from 'react';
import { SelectPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { SelectOptionManager } from './SelectOptionManager';

interface SelectPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: SelectPropertyConfig) => void;
  allowMultiple?: boolean;
}

export function SelectPropertyConfigEditor({ 
  config, 
  onConfigChange, 
  allowMultiple = false 
}: SelectPropertyConfigEditorProps) {
  const selectConfig = config as SelectPropertyConfig;

  const updateConfig = (updates: Partial<SelectPropertyConfig>) => {
    onConfigChange({ ...selectConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <SelectOptionManager
        options={(selectConfig.options || []).filter(option => option.id && option.id.trim() !== '')}
        onOptionsChange={(options) => updateConfig({ options })}
        label="Options"
        placeholder="Enter option name and press Enter"
      />

      {allowMultiple && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allowCustomOptions"
            checked={selectConfig.allowCustomOptions || false}
            onCheckedChange={(checked) => updateConfig({ allowCustomOptions: checked as boolean })}
          />
          <Label htmlFor="allowCustomOptions">Allow users to add custom options</Label>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={selectConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={selectConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
