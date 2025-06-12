
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Minus } from 'lucide-react';

interface FieldVisibilitySettingsProps {
  value: 'always_show' | 'always_hide' | 'show_when_not_empty';
  onValueChange: (value: 'always_show' | 'always_hide' | 'show_when_not_empty') => void;
  disabled?: boolean;
}

export function FieldVisibilitySettings({ 
  value, 
  onValueChange, 
  disabled = false 
}: FieldVisibilitySettingsProps) {
  const getIcon = (setting: string) => {
    switch (setting) {
      case 'always_show':
        return <Eye className="h-3 w-3" />;
      case 'always_hide':
        return <EyeOff className="h-3 w-3" />;
      case 'show_when_not_empty':
        return <Minus className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getDescription = (setting: string) => {
    switch (setting) {
      case 'always_show':
        return 'Always display this property, even when empty';
      case 'always_hide':
        return 'Never display this property on pages';
      case 'show_when_not_empty':
        return 'Only show this property when it has a value';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="visibility-setting">Visibility</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id="visibility-setting" className="w-full">
          <div className="flex items-center gap-2">
            {getIcon(value)}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="show_when_not_empty">
            <div className="flex items-center gap-2">
              <Minus className="h-3 w-3" />
              <span>Hide when empty</span>
            </div>
          </SelectItem>
          <SelectItem value="always_show">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <span>Always show</span>
            </div>
          </SelectItem>
          <SelectItem value="always_hide">
            <div className="flex items-center gap-2">
              <EyeOff className="h-3 w-3" />
              <span>Always hide</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {getDescription(value)}
      </p>
    </div>
  );
}
