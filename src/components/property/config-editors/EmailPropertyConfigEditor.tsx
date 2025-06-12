
import React from 'react';
import { EmailPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface EmailPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: EmailPropertyConfig) => void;
}

export function EmailPropertyConfigEditor({ config, onConfigChange }: EmailPropertyConfigEditorProps) {
  const emailConfig = config as EmailPropertyConfig;

  const updateConfig = (updates: Partial<EmailPropertyConfig>) => {
    onConfigChange({ ...emailConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="allowedDomains">Allowed Email Domains (one per line)</Label>
        <Textarea
          id="allowedDomains"
          value={(emailConfig.allowedDomains || []).join('\n')}
          onChange={(e) => updateConfig({ 
            allowedDomains: e.target.value.split('\n').filter(domain => domain.trim()).map(domain => domain.trim())
          })}
          placeholder="company.com&#10;gmail.com&#10;outlook.com"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all email domains. Enter one domain per line.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Email</Label>
        <Input
          id="defaultValue"
          type="email"
          value={emailConfig.defaultValue || ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value })}
          placeholder="user@example.com"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="requireVerification"
          checked={emailConfig.requireVerification || false}
          onCheckedChange={(checked) => updateConfig({ requireVerification: checked as boolean })}
        />
        <Label htmlFor="requireVerification">Require email verification</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={emailConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={emailConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
