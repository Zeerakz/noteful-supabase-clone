
import React from 'react';
import { RichTextPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface RichTextPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: RichTextPropertyConfig) => void;
}

const FORMATTING_OPTIONS = [
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
  { value: 'underline', label: 'Underline' },
  { value: 'strikethrough', label: 'Strikethrough' },
  { value: 'code', label: 'Code' },
  { value: 'link', label: 'Links' },
  { value: 'heading', label: 'Headings' },
  { value: 'list', label: 'Lists' },
  { value: 'quote', label: 'Quotes' },
];

export function RichTextPropertyConfigEditor({ config, onConfigChange }: RichTextPropertyConfigEditorProps) {
  const richTextConfig = config as RichTextPropertyConfig;

  const updateConfig = (updates: Partial<RichTextPropertyConfig>) => {
    onConfigChange({ ...richTextConfig, ...updates });
  };

  const toggleFormat = (format: string) => {
    const currentFormats = richTextConfig.allowedFormats || [];
    const newFormats = currentFormats.includes(format as any)
      ? currentFormats.filter(f => f !== format)
      : [...currentFormats, format as any];
    updateConfig({ allowedFormats: newFormats });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Allowed Formatting Options</Label>
        <div className="grid grid-cols-2 gap-2">
          {FORMATTING_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={(richTextConfig.allowedFormats || []).includes(option.value as any)}
                onCheckedChange={() => toggleFormat(option.value)}
              />
              <Label htmlFor={option.value} className="text-sm">{option.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxLength">Maximum Length (characters)</Label>
        <Input
          id="maxLength"
          type="number"
          min="1"
          value={richTextConfig.maxLength || ''}
          onChange={(e) => updateConfig({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="Unlimited"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="enableMentions"
          checked={richTextConfig.enableMentions || false}
          onCheckedChange={(checked) => updateConfig({ enableMentions: checked as boolean })}
        />
        <Label htmlFor="enableMentions">Enable @mentions</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="enableHashtags"
          checked={richTextConfig.enableHashtags || false}
          onCheckedChange={(checked) => updateConfig({ enableHashtags: checked as boolean })}
        />
        <Label htmlFor="enableHashtags">Enable #hashtags</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={richTextConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={richTextConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
