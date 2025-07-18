import React from 'react';
import { NumberPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface NumberPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: NumberPropertyConfig) => void;
}

export function NumberPropertyConfigEditor({ config, onConfigChange }: NumberPropertyConfigEditorProps) {
  const numberConfig = config as NumberPropertyConfig;

  const updateConfig = (updates: Partial<NumberPropertyConfig>) => {
    onConfigChange({ ...numberConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayAs">Display Format</Label>
        <Select 
          value={numberConfig.displayAs || 'plain'} 
          onValueChange={(value) => updateConfig({ displayAs: value as 'plain' | 'currency' | 'percentage' | 'progress' | 'ring' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plain">Plain Number</SelectItem>
            <SelectItem value="currency">Currency</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="progress">Progress Bar</SelectItem>
            <SelectItem value="ring">Progress Ring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="format">Number Format</Label>
        <Select value={numberConfig.format || 'decimal'} onValueChange={(value) => updateConfig({ format: value as 'integer' | 'decimal' | 'percentage' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="integer">Integer</SelectItem>
            <SelectItem value="decimal">Decimal</SelectItem>
            <SelectItem value="percentage">Percentage (0-100)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min">Minimum Value</Label>
          <Input
            id="min"
            type="number"
            value={numberConfig.min ?? ''}
            onChange={(e) => updateConfig({ min: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="No minimum"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max">Maximum Value</Label>
          <Input
            id="max"
            type="number"
            value={numberConfig.max ?? ''}
            onChange={(e) => updateConfig({ max: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="No maximum"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="step">Step</Label>
          <Input
            id="step"
            type="number"
            min="0"
            step="0.01"
            value={numberConfig.step ?? ''}
            onChange={(e) => updateConfig({ step: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="precision">Decimal Places</Label>
          <Input
            id="precision"
            type="number"
            min="0"
            max="10"
            value={numberConfig.precision ?? ''}
            onChange={(e) => updateConfig({ precision: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="2"
          />
        </div>
      </div>

      {(numberConfig.displayAs === 'currency' || numberConfig.displayAs === 'plain') && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={numberConfig.prefix || ''}
                onChange={(e) => updateConfig({ prefix: e.target.value })}
                placeholder={numberConfig.displayAs === 'currency' ? '$' : 'e.g., $'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <Input
                id="suffix"
                value={numberConfig.suffix || ''}
                onChange={(e) => updateConfig({ suffix: e.target.value })}
                placeholder="e.g., USD"
              />
            </div>
          </div>
        </>
      )}

      {(numberConfig.displayAs === 'progress' || numberConfig.displayAs === 'ring') && (
        <>
          <Separator />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showPercentage"
              checked={numberConfig.showPercentage || false}
              onCheckedChange={(checked) => updateConfig({ showPercentage: checked as boolean })}
            />
            <Label htmlFor="showPercentage">Show percentage value</Label>
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Value</Label>
        <Input
          id="defaultValue"
          type="number"
          value={numberConfig.defaultValue ?? ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="No default"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={numberConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={numberConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
