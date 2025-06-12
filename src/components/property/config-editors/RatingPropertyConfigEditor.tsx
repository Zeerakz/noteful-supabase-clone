
import React from 'react';
import { RatingPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface RatingPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: RatingPropertyConfig) => void;
}

export function RatingPropertyConfigEditor({ config, onConfigChange }: RatingPropertyConfigEditorProps) {
  const ratingConfig = config as RatingPropertyConfig;

  const updateConfig = (updates: Partial<RatingPropertyConfig>) => {
    onConfigChange({ ...ratingConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="style">Rating Style</Label>
        <Select value={ratingConfig.style || 'stars'} onValueChange={(value) => updateConfig({ style: value as 'stars' | 'numbers' | 'thumbs' | 'hearts' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stars">Stars ⭐</SelectItem>
            <SelectItem value="numbers">Numbers (1-5)</SelectItem>
            <SelectItem value="thumbs">Thumbs 👍👎</SelectItem>
            <SelectItem value="hearts">Hearts ❤️</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scale">Rating Scale</Label>
        <Select value={ratingConfig.scale?.toString() || '5'} onValueChange={(value) => updateConfig({ scale: parseInt(value) })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">1-3</SelectItem>
            <SelectItem value="5">1-5</SelectItem>
            <SelectItem value="10">1-10</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="allowHalf"
          checked={ratingConfig.allowHalf || false}
          onCheckedChange={(checked) => updateConfig({ allowHalf: checked as boolean })}
        />
        <Label htmlFor="allowHalf">Allow half ratings (e.g., 3.5 stars)</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lowLabel">Low Rating Label</Label>
          <Input
            id="lowLabel"
            value={ratingConfig.labels?.low || ''}
            onChange={(e) => updateConfig({ 
              labels: { ...ratingConfig.labels, low: e.target.value }
            })}
            placeholder="e.g., Poor, Disagree"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="highLabel">High Rating Label</Label>
          <Input
            id="highLabel"
            value={ratingConfig.labels?.high || ''}
            onChange={(e) => updateConfig({ 
              labels: { ...ratingConfig.labels, high: e.target.value }
            })}
            placeholder="e.g., Excellent, Agree"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Rating</Label>
        <Input
          id="defaultValue"
          type="number"
          min="1"
          max={ratingConfig.scale || 5}
          step={ratingConfig.allowHalf ? "0.5" : "1"}
          value={ratingConfig.defaultValue || ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="No default"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={ratingConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={ratingConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
