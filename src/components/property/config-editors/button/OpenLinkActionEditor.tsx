
import React from 'react';
import { ButtonAction, OpenLinkConfig } from '@/types/property/configs/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface OpenLinkActionEditorProps {
  action: ButtonAction;
  onActionChange: (updates: Partial<ButtonAction> | { config: any }) => void;
}

export function OpenLinkActionEditor({ action, onActionChange }: OpenLinkActionEditorProps) {
  const linkConfig = action.config as OpenLinkConfig;

  const updateConfig = (updates: Partial<OpenLinkConfig>) => {
    onActionChange({
      config: { ...linkConfig, ...updates },
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>URL</Label>
        <Input
          value={linkConfig.url || ''}
          onChange={(e) => updateConfig({ url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={linkConfig.openInNewTab}
          onCheckedChange={(checked) => updateConfig({ openInNewTab: checked })}
        />
        <Label>Open in new tab</Label>
      </div>
    </div>
  );
}
