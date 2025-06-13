
import React from 'react';
import { StatusPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { StatusGroupManager } from './StatusGroupManager';

interface StatusPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: StatusPropertyConfig) => void;
}

export function StatusPropertyConfigEditor({ config, onConfigChange }: StatusPropertyConfigEditorProps) {
  const statusConfig = config as StatusPropertyConfig;

  const updateConfig = (updates: Partial<StatusPropertyConfig>) => {
    onConfigChange({ ...statusConfig, ...updates });
  };

  // Get all available options across all groups and filter out empty IDs
  const allOptions = statusConfig.groups?.flatMap(group => group.options || []) || [];
  const validOptions = allOptions.filter(option => option.id && option.id.trim() !== '');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayAs">Display As</Label>
        <Select 
          value={statusConfig.displayAs || 'dropdown'} 
          onValueChange={(value) => updateConfig({ displayAs: value as 'dropdown' | 'buttons' | 'progress' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dropdown">Dropdown</SelectItem>
            <SelectItem value="buttons">Button Group</SelectItem>
            <SelectItem value="progress">Progress Indicator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StatusGroupManager
        groups={statusConfig.groups || []}
        onGroupsChange={(groups) => updateConfig({ groups })}
      />

      <div className="space-y-2">
        <Label htmlFor="defaultStatus">Default Status</Label>
        <Select 
          value={statusConfig.defaultStatus || ''} 
          onValueChange={(value) => updateConfig({ defaultStatus: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select default status" />
          </SelectTrigger>
          <SelectContent>
            {statusConfig.groups?.map((group) => {
              // Filter valid options within each group
              const validGroupOptions = (group.options || []).filter(option => option.id && option.id.trim() !== '');
              
              if (validGroupOptions.length === 0) return null;
              
              return (
                <React.Fragment key={group.id}>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {group.name}
                  </div>
                  {validGroupOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: option.color }}
                        />
                        {option.name}
                      </div>
                    </SelectItem>
                  ))}
                </React.Fragment>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={statusConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={statusConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
