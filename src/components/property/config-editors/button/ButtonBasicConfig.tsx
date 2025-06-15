
import React from 'react';
import { ButtonPropertyConfig } from '@/types/property/configs/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ButtonBasicConfigProps {
  config: ButtonPropertyConfig;
  onConfigChange: (updates: Partial<ButtonPropertyConfig>) => void;
}

export function ButtonBasicConfig({ config, onConfigChange }: ButtonBasicConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Button Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Button Label</Label>
          <Input
            value={config.label}
            onChange={(e) => onConfigChange({ label: e.target.value })}
            placeholder="Button text"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Variant</Label>
            <Select
              value={config.variant}
              onValueChange={(value: any) => onConfigChange({ variant: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
                <SelectItem value="destructive">Destructive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Size</Label>
            <Select
              value={config.size}
              onValueChange={(value: any) => onConfigChange({ size: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.disabled || false}
            onCheckedChange={(checked) => onConfigChange({ disabled: checked })}
          />
          <Label>Disabled</Label>
        </div>
      </CardContent>
    </Card>
  );
}
