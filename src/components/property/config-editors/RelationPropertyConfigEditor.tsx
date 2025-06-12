
import React from 'react';
import { RelationPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useDatabases } from '@/hooks/useDatabases';

interface RelationPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: RelationPropertyConfig) => void;
  workspaceId?: string;
}

export function RelationPropertyConfigEditor({ config, onConfigChange, workspaceId }: RelationPropertyConfigEditorProps) {
  const relationConfig = config as RelationPropertyConfig;
  const { databases } = useDatabases(workspaceId);

  const updateConfig = (updates: Partial<RelationPropertyConfig>) => {
    onConfigChange({ ...relationConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="targetDatabase">Target Database</Label>
        <Select value={relationConfig.targetDatabaseId || ''} onValueChange={(value) => updateConfig({ targetDatabaseId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a database" />
          </SelectTrigger>
          <SelectContent>
            {databases?.map((database) => (
              <SelectItem key={database.id} value={database.id}>
                {database.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayProperty">Display Property</Label>
        <Input
          id="displayProperty"
          value={relationConfig.displayProperty || ''}
          onChange={(e) => updateConfig({ displayProperty: e.target.value })}
          placeholder="title"
        />
        <p className="text-xs text-muted-foreground">
          Which property from the target database to display (default: title)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relatedPropertyName">Related Property Name</Label>
        <Input
          id="relatedPropertyName"
          value={relationConfig.relatedPropertyName || ''}
          onChange={(e) => updateConfig({ relatedPropertyName: e.target.value })}
          placeholder="Related items"
        />
        <p className="text-xs text-muted-foreground">
          Name for the reverse relationship property (if bidirectional)
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="allowMultiple"
          checked={relationConfig.allowMultiple || false}
          onCheckedChange={(checked) => updateConfig({ allowMultiple: checked as boolean })}
        />
        <Label htmlFor="allowMultiple">Allow multiple relations</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="bidirectional"
          checked={relationConfig.bidirectional || false}
          onCheckedChange={(checked) => updateConfig({ bidirectional: checked as boolean })}
        />
        <Label htmlFor="bidirectional">Create bidirectional relationship</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={relationConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={relationConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
