
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

  // Filter and validate options before passing to SelectOptionManager
  const validOptions = (selectConfig.options || []).filter(option => {
    const isValid = option.id && option.id.trim() !== '';
    if (!isValid) {
      console.warn('SelectPropertyConfigEditor: Filtering out option with empty ID:', option);
    }
    return isValid;
  });

  console.log('SelectPropertyConfigEditor: Valid options:', validOptions);

  const handleOptionsChange = (options: any[]) => {
    // Additional validation before updating config
    const finalValidOptions = options.filter(option => {
      const isValid = option.id && option.id.trim() !== '';
      if (!isValid) {
        console.warn('SelectPropertyConfigEditor: Rejecting option with empty ID:', option);
      }
      return isValid;
    });
    
    console.log('SelectPropertyConfigEditor: Updating config with options:', finalValidOptions);
    updateConfig({ options: finalValidOptions });
  };

  return (
    <div className="space-y-4">
      <SelectOptionManager
        options={validOptions}
        onOptionsChange={handleOptionsChange}
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
