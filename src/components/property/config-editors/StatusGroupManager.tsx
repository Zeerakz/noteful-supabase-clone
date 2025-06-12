
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface StatusGroup {
  id: string;
  name: string;
  color: string;
  options: StatusOption[];
}

export interface StatusOption {
  id: string;
  name: string;
  color: string;
  groupId: string;
}

interface StatusGroupManagerProps {
  groups: StatusGroup[];
  onGroupsChange: (groups: StatusGroup[]) => void;
}

const DEFAULT_COLORS = [
  '#64748b', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'
];

export function StatusGroupManager({ groups, onGroupsChange }: StatusGroupManagerProps) {
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionGroup, setNewOptionGroup] = useState('');

  const getNextColor = () => {
    const usedColors = groups.flatMap(g => [g.color, ...g.options.map(o => o.color)]);
    return DEFAULT_COLORS.find(color => !usedColors.includes(color)) || DEFAULT_COLORS[0];
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: StatusGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      color: getNextColor(),
      options: []
    };
    
    onGroupsChange([...groups, newGroup]);
    setNewGroupName('');
  };

  const updateGroupName = (groupId: string, newName: string) => {
    if (!newName.trim()) return;
    
    const updatedGroups = groups.map(group => 
      group.id === groupId 
        ? { ...group, name: newName.trim() }
        : group
    );
    onGroupsChange(updatedGroups);
    setEditingGroup(null);
  };

  const deleteGroup = (groupId: string) => {
    const updatedGroups = groups.filter(group => group.id !== groupId);
    onGroupsChange(updatedGroups);
  };

  const addOption = () => {
    if (!newOptionName.trim() || !newOptionGroup) return;
    
    const newOption: StatusOption = {
      id: `option-${Date.now()}`,
      name: newOptionName.trim(),
      color: getNextColor(),
      groupId: newOptionGroup
    };
    
    const updatedGroups = groups.map(group => 
      group.id === newOptionGroup
        ? { ...group, options: [...group.options, newOption] }
        : group
    );
    
    onGroupsChange(updatedGroups);
    setNewOptionName('');
    setNewOptionGroup('');
  };

  const updateOptionName = (optionId: string, newName: string) => {
    if (!newName.trim()) return;
    
    const updatedGroups = groups.map(group => ({
      ...group,
      options: group.options.map(option => 
        option.id === optionId 
          ? { ...option, name: newName.trim() }
          : option
      )
    }));
    
    onGroupsChange(updatedGroups);
    setEditingOption(null);
  };

  const reassignOption = (optionId: string, newGroupId: string) => {
    const updatedGroups = groups.map(group => ({
      ...group,
      options: group.options.filter(option => option.id !== optionId)
    }));
    
    const finalGroups = updatedGroups.map(group => 
      group.id === newGroupId
        ? {
            ...group,
            options: [
              ...group.options,
              {
                ...groups.flatMap(g => g.options).find(o => o.id === optionId)!,
                groupId: newGroupId
              }
            ]
          }
        : group
    );
    
    onGroupsChange(finalGroups);
  };

  const deleteOption = (optionId: string) => {
    const updatedGroups = groups.map(group => ({
      ...group,
      options: group.options.filter(option => option.id !== optionId)
    }));
    onGroupsChange(updatedGroups);
  };

  return (
    <div className="space-y-6">
      {/* Groups */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Status Groups</Label>
        {groups.map((group) => (
          <div key={group.id} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: group.color }}
                />
                {editingGroup === group.id ? (
                  <Input
                    value={group.name}
                    onChange={(e) => updateGroupName(group.id, e.target.value)}
                    onBlur={() => setEditingGroup(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateGroupName(group.id, group.name);
                      }
                      if (e.key === 'Escape') {
                        setEditingGroup(null);
                      }
                    }}
                    className="h-6 text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium">{group.name}</span>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingGroup(group.id)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename Group
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteGroup(group.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Options in this group */}
            <div className="space-y-2 pl-6">
              {group.options.map((option) => (
                <div key={option.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: option.color }}
                    />
                    {editingOption === option.id ? (
                      <Input
                        value={option.name}
                        onChange={(e) => updateOptionName(option.id, e.target.value)}
                        onBlur={() => setEditingOption(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateOptionName(option.id, option.name);
                          }
                          if (e.key === 'Escape') {
                            setEditingOption(null);
                          }
                        }}
                        className="h-6 text-sm"
                        autoFocus
                      />
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {option.name}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingOption(option.id)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      {groups.length > 1 && (
                        <>
                          {groups
                            .filter(g => g.id !== group.id)
                            .map(targetGroup => (
                              <DropdownMenuItem 
                                key={targetGroup.id}
                                onClick={() => reassignOption(option.id, targetGroup.id)}
                              >
                                Move to {targetGroup.name}
                              </DropdownMenuItem>
                            ))}
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={() => deleteOption(option.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Add new group */}
        <div className="flex gap-2">
          <Input
            placeholder="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addGroup();
              }
            }}
          />
          <Button onClick={addGroup} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Group
          </Button>
        </div>
      </div>

      {/* Add new option */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Add Status Option</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Option name"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newOptionGroup) {
                addOption();
              }
            }}
          />
          <Select value={newOptionGroup} onValueChange={setNewOptionGroup}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    {group.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addOption} size="sm" disabled={!newOptionName.trim() || !newOptionGroup}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
