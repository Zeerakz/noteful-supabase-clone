
import React from 'react';
import { DatePropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface DatePropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: DatePropertyConfig) => void;
  includeTime?: boolean;
}

export function DatePropertyConfigEditor({ config, onConfigChange, includeTime = false }: DatePropertyConfigEditorProps) {
  const dateConfig = config as DatePropertyConfig;

  const updateConfig = (updates: Partial<DatePropertyConfig>) => {
    onConfigChange({ ...dateConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="format">Display Format</Label>
        <Select value={dateConfig.format || 'relative'} onValueChange={(value) => updateConfig({ format: value as 'relative' | 'absolute' | 'custom' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relative">Relative (e.g., "2 days ago")</SelectItem>
            <SelectItem value="absolute">Absolute (e.g., "Dec 25, 2023")</SelectItem>
            <SelectItem value="custom">Custom format</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {dateConfig.format === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="customFormat">Custom Format</Label>
          <Input
            id="customFormat"
            value={dateConfig.customFormat || ''}
            onChange={(e) => updateConfig({ customFormat: e.target.value })}
            placeholder="e.g., YYYY-MM-DD, MMM d, yyyy"
          />
          <p className="text-xs text-muted-foreground">
            Use date-fns format tokens (YYYY for year, MM for month, DD for day, etc.)
          </p>
        </div>
      )}

      {includeTime && (
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={dateConfig.timezone || 'local'} onValueChange={(value) => updateConfig({ timezone: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local timezone</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">Eastern Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/Denver">Mountain Time</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minDate">Minimum Date</Label>
          <Input
            id="minDate"
            type={includeTime ? 'datetime-local' : 'date'}
            value={dateConfig.minDate || ''}
            onChange={(e) => updateConfig({ minDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxDate">Maximum Date</Label>
          <Input
            id="maxDate"
            type={includeTime ? 'datetime-local' : 'date'}
            value={dateConfig.maxDate || ''}
            onChange={(e) => updateConfig({ maxDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Value</Label>
        <Input
          id="defaultValue"
          type={includeTime ? 'datetime-local' : 'date'}
          value={dateConfig.defaultValue || ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={dateConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={dateConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
