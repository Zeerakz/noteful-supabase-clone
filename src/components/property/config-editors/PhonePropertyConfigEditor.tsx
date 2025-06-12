
import React from 'react';
import { PhonePropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface PhonePropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: PhonePropertyConfig) => void;
}

export function PhonePropertyConfigEditor({ config, onConfigChange }: PhonePropertyConfigEditorProps) {
  const phoneConfig = config as PhonePropertyConfig;

  const updateConfig = (updates: Partial<PhonePropertyConfig>) => {
    onConfigChange({ ...phoneConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="format">Phone Format</Label>
        <Select value={phoneConfig.format || 'international'} onValueChange={(value) => updateConfig({ format: value as 'international' | 'national' | 'custom' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="international">International (+1 234 567 8900)</SelectItem>
            <SelectItem value="national">National (234-567-8900)</SelectItem>
            <SelectItem value="custom">Custom format</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {phoneConfig.format === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="customFormat">Custom Format</Label>
          <Input
            id="customFormat"
            value={phoneConfig.customFormat || ''}
            onChange={(e) => updateConfig({ customFormat: e.target.value })}
            placeholder="e.g., (###) ###-####"
          />
          <p className="text-xs text-muted-foreground">
            Use # for digits. Example: (###) ###-#### becomes (123) 456-7890
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="defaultCountryCode">Default Country Code</Label>
        <Select value={phoneConfig.defaultCountryCode || 'US'} onValueChange={(value) => updateConfig({ defaultCountryCode: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">United States (+1)</SelectItem>
            <SelectItem value="CA">Canada (+1)</SelectItem>
            <SelectItem value="GB">United Kingdom (+44)</SelectItem>
            <SelectItem value="DE">Germany (+49)</SelectItem>
            <SelectItem value="FR">France (+33)</SelectItem>
            <SelectItem value="JP">Japan (+81)</SelectItem>
            <SelectItem value="AU">Australia (+61)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowedCountries">Allowed Countries (comma-separated)</Label>
        <Input
          id="allowedCountries"
          value={(phoneConfig.allowedCountries || []).join(', ')}
          onChange={(e) => updateConfig({ 
            allowedCountries: e.target.value.split(',').filter(country => country.trim()).map(country => country.trim().toUpperCase())
          })}
          placeholder="US, CA, GB, DE"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all countries. Use ISO country codes (US, CA, GB, etc.).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Phone Number</Label>
        <Input
          id="defaultValue"
          type="tel"
          value={phoneConfig.defaultValue || ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value })}
          placeholder="+1 234 567 8900"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={phoneConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={phoneConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
