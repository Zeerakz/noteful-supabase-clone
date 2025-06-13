
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckboxPropertyConfig } from '@/types/property/configs/checkbox';

interface CheckboxPropertyConfigEditorProps {
  config: CheckboxPropertyConfig;
  onConfigChange: (config: CheckboxPropertyConfig) => void;
  workspaceId?: string;
  availableProperties?: any[];
}

export function CheckboxPropertyConfigEditor({ 
  config, 
  onConfigChange,
  workspaceId,
  availableProperties
}: CheckboxPropertyConfigEditorProps) {
  const handleConfigChange = (field: keyof CheckboxPropertyConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center space-x-3 space-y-0">
        <Checkbox
          checked={config.defaultValue || false}
          onCheckedChange={(checked) => handleConfigChange('defaultValue', checked)}
        />
        <div className="space-y-1 leading-none">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Default value
          </label>
          <p className="text-sm text-muted-foreground">
            The default state for new entries
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          True label
        </label>
        <Input
          value={config.trueLabel || ''}
          onChange={(e) => handleConfigChange('trueLabel', e.target.value)}
          placeholder="Yes"
        />
        <p className="text-sm text-muted-foreground">
          Text displayed when checkbox is checked
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          False label
        </label>
        <Input
          value={config.falseLabel || ''}
          onChange={(e) => handleConfigChange('falseLabel', e.target.value)}
          placeholder="No"
        />
        <p className="text-sm text-muted-foreground">
          Text displayed when checkbox is unchecked
        </p>
      </div>
    </div>
  );
}
