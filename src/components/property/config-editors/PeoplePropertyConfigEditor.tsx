
import React from 'react';
import { PeoplePropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface PeoplePropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: PeoplePropertyConfig) => void;
  workspaceId?: string;
}

export function PeoplePropertyConfigEditor({ config, onConfigChange, workspaceId }: PeoplePropertyConfigEditorProps) {
  const peopleConfig = config as PeoplePropertyConfig;

  const updateConfig = (updates: Partial<PeoplePropertyConfig>) => {
    onConfigChange({ ...peopleConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="allowMultiple"
          checked={peopleConfig.allowMultiple || false}
          onCheckedChange={(checked) => updateConfig({ allowMultiple: checked as boolean })}
        />
        <Label htmlFor="allowMultiple">Allow multiple people</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="restrictToWorkspace"
          checked={peopleConfig.restrictToWorkspace !== false}
          onCheckedChange={(checked) => updateConfig({ restrictToWorkspace: checked as boolean })}
        />
        <Label htmlFor="restrictToWorkspace">Restrict to workspace members</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="allowExternal"
          checked={peopleConfig.allowExternal || false}
          onCheckedChange={(checked) => updateConfig({ allowExternal: checked as boolean })}
        />
        <Label htmlFor="allowExternal">Allow external users (by email)</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="roles">Allowed Roles (comma-separated)</Label>
        <Input
          id="roles"
          value={(peopleConfig.roles || []).join(', ')}
          onChange={(e) => updateConfig({ 
            roles: e.target.value.split(',').filter(role => role.trim()).map(role => role.trim())
          })}
          placeholder="admin, editor, viewer"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all roles. Only users with these roles can be selected.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultAssignee">Default Assignee (User ID)</Label>
        <Input
          id="defaultAssignee"
          value={peopleConfig.defaultAssignee || ''}
          onChange={(e) => updateConfig({ defaultAssignee: e.target.value })}
          placeholder="Enter default user ID"
        />
        <p className="text-xs text-muted-foreground">
          User ID of the person to assign by default.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={peopleConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={peopleConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
