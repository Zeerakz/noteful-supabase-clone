
import React from 'react';
import { ProgressPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface ProgressPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: ProgressPropertyConfig) => void;
}

export function ProgressPropertyConfigEditor({ config, onConfigChange }: ProgressPropertyConfigEditorProps) {
  const progressConfig = config as ProgressPropertyConfig;

  const updateConfig = (updates: Partial<ProgressPropertyConfig>) => {
    onConfigChange({ ...progressConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayAs">Display As</Label>
        <Select value={progressConfig.displayAs || 'bar'} onValueChange={(value) => updateConfig({ displayAs: value as 'bar' | 'circle' | 'number' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Progress Bar</SelectItem>
            <SelectItem value="circle">Circular Progress</SelectItem>
            <SelectItem value="number">Number Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min">Minimum Value</Label>
          <Input
            id="min"
            type="number"
            value={progressConfig.min ?? ''}
            onChange={(e) => updateConfig({ min: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max">Maximum Value</Label>
          <Input
            id="max"
            type="number"
            value={progressConfig.max ?? ''}
            onChange={(e) => updateConfig({ max: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">Unit</Label>
        <Input
          id="unit"
          value={progressConfig.unit || ''}
          onChange={(e) => updateConfig({ unit: e.target.value })}
          placeholder="e.g., %, items, tasks"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Progress Color</Label>
        <Input
          id="color"
          type="color"
          value={progressConfig.color || '#3b82f6'}
          onChange={(e) => updateConfig({ color: e.target.value })}
          className="w-20 h-10"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="showPercentage"
          checked={progressConfig.showPercentage !== false}
          onCheckedChange={(checked) => updateConfig({ showPercentage: checked as boolean })}
        />
        <Label htmlFor="showPercentage">Show percentage</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Value</Label>
        <Input
          id="defaultValue"
          type="number"
          min={progressConfig.min || 0}
          max={progressConfig.max || 100}
          value={progressConfig.defaultValue ?? ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="0"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={progressConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={progressConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
