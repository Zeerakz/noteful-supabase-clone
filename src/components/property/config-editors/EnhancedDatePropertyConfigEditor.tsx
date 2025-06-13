
import React from 'react';
import { DatePropertyConfig } from '@/types/property/configs/date';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EnhancedDatePropertyConfigEditorProps {
  config: DatePropertyConfig;
  onConfigChange: (config: DatePropertyConfig) => void;
  includeTime?: boolean;
}

export function EnhancedDatePropertyConfigEditor({ 
  config, 
  onConfigChange, 
  includeTime = false 
}: EnhancedDatePropertyConfigEditorProps) {
  const updateConfig = (updates: Partial<DatePropertyConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Display Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="format">Display Format</Label>
            <Select value={config.format || 'relative'} onValueChange={(value) => updateConfig({ format: value as 'relative' | 'absolute' | 'custom' })}>
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

          {config.format === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customFormat">Custom Format</Label>
              <Input
                id="customFormat"
                value={config.customFormat || ''}
                onChange={(e) => updateConfig({ customFormat: e.target.value })}
                placeholder="e.g., YYYY-MM-DD, MMM d, yyyy"
              />
              <p className="text-xs text-muted-foreground">
                Use date-fns format tokens (YYYY for year, MM for month, DD for day, etc.)
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeTime"
              checked={config.includeTime || false}
              onCheckedChange={(checked) => updateConfig({ includeTime: checked as boolean })}
            />
            <Label htmlFor="includeTime">Include time</Label>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Enhanced Features</CardTitle>
          <CardDescription>Enable advanced date functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableRange"
              checked={config.enableRange || false}
              onCheckedChange={(checked) => updateConfig({ enableRange: checked as boolean })}
            />
            <Label htmlFor="enableRange">Enable date ranges</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableNaturalLanguage"
              checked={config.enableNaturalLanguage || false}
              onCheckedChange={(checked) => updateConfig({ enableNaturalLanguage: checked as boolean })}
            />
            <Label htmlFor="enableNaturalLanguage">Natural language input ("next Monday", "tomorrow")</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableReminders"
              checked={config.enableReminders || false}
              onCheckedChange={(checked) => updateConfig({ enableReminders: checked as boolean })}
            />
            <Label htmlFor="enableReminders">Enable reminders</Label>
          </div>

          {config.enableReminders && (
            <div className="space-y-2">
              <Label htmlFor="defaultReminderOffset">Default reminder (minutes before)</Label>
              <Input
                id="defaultReminderOffset"
                type="number"
                value={config.defaultReminderOffset || 15}
                onChange={(e) => updateConfig({ defaultReminderOffset: parseInt(e.target.value) || 15 })}
                placeholder="15"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timezone Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Timezone Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Default Timezone</Label>
            <Select value={config.timezone || 'local'} onValueChange={(value) => updateConfig({ timezone: value })}>
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
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minDate">Minimum Date</Label>
              <Input
                id="minDate"
                type={config.includeTime ? 'datetime-local' : 'date'}
                value={config.minDate || ''}
                onChange={(e) => updateConfig({ minDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDate">Maximum Date</Label>
              <Input
                id="maxDate"
                type={config.includeTime ? 'datetime-local' : 'date'}
                value={config.maxDate || ''}
                onChange={(e) => updateConfig({ maxDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultValue">Default Value</Label>
            <Input
              id="defaultValue"
              type={config.includeTime ? 'datetime-local' : 'date'}
              value={config.defaultValue || ''}
              onChange={(e) => updateConfig({ defaultValue: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={config.required || false}
              onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
            />
            <Label htmlFor="required">Required field</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description || ''}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="Enter field description"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
