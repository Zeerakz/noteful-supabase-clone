import React, { useState } from 'react';
import { SelectPropertyConfig, SelectOption } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface SelectPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: SelectPropertyConfig) => void;
  allowMultiple?: boolean;
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#0f172a'
];

export function SelectPropertyConfigEditor({ config, onConfigChange, allowMultiple = false }: SelectPropertyConfigEditorProps) {
  const selectConfig = config as SelectPropertyConfig;
  const [newOptionName, setNewOptionName] = useState('');

  const updateConfig = (updates: Partial<SelectPropertyConfig>) => {
    onConfigChange({ ...selectConfig, ...updates });
  };

  const addOption = () => {
    if (!newOptionName.trim()) return;

    const newOption: SelectOption = {
      id: `option_${Date.now()}`,
      name: newOptionName.trim(),
      color: DEFAULT_COLORS[selectConfig.options?.length % DEFAULT_COLORS.length] || DEFAULT_COLORS[0]
    };

    updateConfig({
      options: [...(selectConfig.options || []), newOption]
    });
    setNewOptionName('');
  };

  const updateOption = (optionId: string, updates: Partial<SelectOption>) => {
    const updatedOptions = (selectConfig.options || []).map(option =>
      option.id === optionId ? { ...option, ...updates } : option
    );
    updateConfig({ options: updatedOptions });
  };

  const removeOption = (optionId: string) => {
    const updatedOptions = (selectConfig.options || []).filter(option => option.id !== optionId);
    updateConfig({ options: updatedOptions });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Options</Label>
        
        {/* Add new option */}
        <div className="flex gap-2">
          <Input
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            placeholder="Enter option name"
            onKeyPress={(e) => e.key === 'Enter' && addOption()}
          />
          <Button onClick={addOption} size="sm" disabled={!newOptionName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Existing options */}
        <div className="space-y-2">
          {(selectConfig.options || []).map((option) => (
            <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
              <div 
                className="w-4 h-4 rounded-full border cursor-pointer"
                style={{ backgroundColor: option.color }}
                onClick={() => {
                  const newColor = DEFAULT_COLORS[(DEFAULT_COLORS.indexOf(option.color || '') + 1) % DEFAULT_COLORS.length];
                  updateOption(option.id, { color: newColor });
                }}
              />
              <Input
                value={option.name}
                onChange={(e) => updateOption(option.id, { name: e.target.value })}
                className="flex-1"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeOption(option.id)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

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
