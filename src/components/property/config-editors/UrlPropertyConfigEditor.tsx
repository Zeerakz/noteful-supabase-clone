
import React from 'react';
import { UrlPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface UrlPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: UrlPropertyConfig) => void;
}

export function UrlPropertyConfigEditor({ config, onConfigChange }: UrlPropertyConfigEditorProps) {
  const urlConfig = config as UrlPropertyConfig;

  const updateConfig = (updates: Partial<UrlPropertyConfig>) => {
    onConfigChange({ ...urlConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayAs">Display As</Label>
        <Select value={urlConfig.displayAs || 'link'} onValueChange={(value) => updateConfig({ displayAs: value as 'link' | 'embed' | 'preview' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="embed">Embed (if supported)</SelectItem>
            <SelectItem value="preview">Preview card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowedDomains">Allowed Domains (one per line)</Label>
        <Textarea
          id="allowedDomains"
          value={(urlConfig.allowedDomains || []).join('\n')}
          onChange={(e) => updateConfig({ 
            allowedDomains: e.target.value.split('\n').filter(domain => domain.trim()).map(domain => domain.trim())
          })}
          placeholder="example.com&#10;github.com&#10;youtube.com"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all domains. Enter one domain per line without protocol (http/https).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default URL</Label>
        <Input
          id="defaultValue"
          type="url"
          value={urlConfig.defaultValue || ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={urlConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={urlConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
