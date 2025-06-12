import React, { useState } from 'react';
import { StatusPropertyConfig, SelectOption } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';

interface StatusPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: StatusPropertyConfig) => void;
}

const DEFAULT_STATUS_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#0f172a'
];

export function StatusPropertyConfigEditor({ config, onConfigChange }: StatusPropertyConfigEditorProps) {
  const statusConfig = config as StatusPropertyConfig;
  const [newStatusName, setNewStatusName] = useState('');

  const updateConfig = (updates: Partial<StatusPropertyConfig>) => {
    onConfigChange({ ...statusConfig, ...updates });
  };

  const addStatus = () => {
    if (!newStatusName.trim()) return;

    const newStatus: SelectOption = {
      id: `status_${Date.now()}`,
      name: newStatusName.trim(),
      color: DEFAULT_STATUS_COLORS[statusConfig.options?.length % DEFAULT_STATUS_COLORS.length] || DEFAULT_STATUS_COLORS[0]
    };

    updateConfig({
      options: [...(statusConfig.options || []), newStatus]
    });
    setNewStatusName('');
  };

  const updateStatus = (statusId: string, updates: Partial<SelectOption>) => {
    const updatedOptions = (statusConfig.options || []).map(status =>
      status.id === statusId ? { ...status, ...updates } : status
    );
    updateConfig({ options: updatedOptions });
  };

  const removeStatus = (statusId: string) => {
    const updatedOptions = (statusConfig.options || []).filter(status => status.id !== statusId);
    updateConfig({ options: updatedOptions });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayAs">Display As</Label>
        <Select value={statusConfig.displayAs || 'dropdown'} onValueChange={(value) => updateConfig({ displayAs: value as 'dropdown' | 'buttons' | 'progress' })}>
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

      <div className="space-y-3">
        <Label>Status Options</Label>
        
        {/* Add new status */}
        <div className="flex gap-2">
          <Input
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            placeholder="Enter status name"
            onKeyPress={(e) => e.key === 'Enter' && addStatus()}
          />
          <Button onClick={addStatus} size="sm" disabled={!newStatusName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Existing statuses */}
        <div className="space-y-2">
          {(statusConfig.options || []).map((status) => (
            <div key={status.id} className="flex items-center gap-2 p-2 border rounded">
              <div 
                className="w-4 h-4 rounded-full border cursor-pointer"
                style={{ backgroundColor: status.color }}
                onClick={() => {
                  const newColor = DEFAULT_STATUS_COLORS[(DEFAULT_STATUS_COLORS.indexOf(status.color || '') + 1) % DEFAULT_STATUS_COLORS.length];
                  updateStatus(status.id, { color: newColor });
                }}
              />
              <Input
                value={status.name}
                onChange={(e) => updateStatus(status.id, { name: e.target.value })}
                className="flex-1"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeStatus(status.id)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultStatus">Default Status</Label>
        <Select value={statusConfig.defaultStatus || ''} onValueChange={(value) => updateConfig({ defaultStatus: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select default status" />
          </SelectTrigger>
          <SelectContent>
            {(statusConfig.options || []).map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
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
