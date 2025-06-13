
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Group, Plus, X, GripVertical } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { GroupingConfig, GroupingLevel } from '@/types/grouping';

interface MultiLevelGroupingControlsProps {
  fields: DatabaseField[];
  groupingConfig: GroupingConfig;
  onGroupingConfigChange: (config: GroupingConfig) => void;
}

export function MultiLevelGroupingControls({
  fields,
  groupingConfig,
  onGroupingConfigChange,
}: MultiLevelGroupingControlsProps) {
  // Only show fields that can be grouped
  const groupableFields = fields.filter(field => 
    ['select', 'multi_select', 'status', 'checkbox', 'text', 'number'].includes(field.type) &&
    field.id && field.id.trim() !== ''
  );

  const addGroupingLevel = () => {
    if (groupingConfig.levels.length >= groupingConfig.maxLevels) return;
    
    const newLevel: GroupingLevel = {
      fieldId: '',
      level: groupingConfig.levels.length
    };
    
    onGroupingConfigChange({
      ...groupingConfig,
      levels: [...groupingConfig.levels, newLevel]
    });
  };

  const updateGroupingLevel = (index: number, fieldId: string) => {
    const updatedLevels = groupingConfig.levels.map((level, i) => 
      i === index ? { ...level, fieldId } : level
    );
    
    onGroupingConfigChange({
      ...groupingConfig,
      levels: updatedLevels
    });
  };

  const removeGroupingLevel = (index: number) => {
    const updatedLevels = groupingConfig.levels
      .filter((_, i) => i !== index)
      .map((level, i) => ({ ...level, level: i }));
    
    onGroupingConfigChange({
      ...groupingConfig,
      levels: updatedLevels
    });
  };

  const clearAllGrouping = () => {
    onGroupingConfigChange({
      ...groupingConfig,
      levels: []
    });
  };

  const getFieldName = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.name || 'Select field';
  };

  const getAvailableFields = (currentIndex: number) => {
    const usedFieldIds = groupingConfig.levels
      .filter((_, index) => index !== currentIndex)
      .map(level => level.fieldId);
    
    return groupableFields.filter(field => !usedFieldIds.includes(field.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Group className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Multi-Level Grouping</span>
        </div>
        
        {groupingConfig.levels.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllGrouping}
            className="h-8 text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {groupingConfig.levels.map((level, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/20">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            
            <Badge variant="outline" className="text-xs">
              {index === 0 ? 'Primary' : index === 1 ? 'Secondary' : `Level ${index + 1}`}
            </Badge>
            
            <Select
              value={level.fieldId}
              onValueChange={(fieldId) => updateGroupingLevel(index, fieldId)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableFields(index).map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeGroupingLevel(index)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {groupingConfig.levels.length < groupingConfig.maxLevels && (
          <Button
            variant="outline"
            size="sm"
            onClick={addGroupingLevel}
            className="w-full gap-2"
            disabled={groupableFields.length <= groupingConfig.levels.length}
          >
            <Plus className="h-4 w-4" />
            Add Grouping Level
          </Button>
        )}
      </div>
      
      {groupingConfig.levels.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Add grouping levels to organize your data hierarchically
        </p>
      )}
    </div>
  );
}
