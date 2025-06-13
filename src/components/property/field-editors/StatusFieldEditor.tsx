
import React from 'react';
import { StatusPropertyConfig } from '@/types/property';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface StatusFieldEditorProps {
  value: any;
  config: StatusPropertyConfig;
  onChange: (value: any) => void;
  field?: any;
  workspaceId?: string;
  pageId?: string;
}

export function StatusFieldEditor({ value, config, onChange }: StatusFieldEditorProps) {
  const allOptions = config.groups?.flatMap(group => group.options || []) || [];
  
  // Filter out options with empty IDs to prevent Select.Item errors
  const validOptions = allOptions.filter(option => option.id && option.id.trim() !== '');
  
  const selectedOption = validOptions.find(opt => opt.id === value);

  const handleChange = (newValue: string) => {
    // Only proceed if the value is not empty
    if (newValue && newValue.trim() !== '') {
      onChange(newValue);
    }
  };

  return (
    <Select value={value || ''} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select status">
          {selectedOption && (
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: selectedOption.color }}
              />
              {selectedOption.name}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {config.groups?.map((group, groupIndex) => {
          // Filter valid options within each group
          const validGroupOptions = (group.options || []).filter(option => option.id && option.id.trim() !== '');
          
          if (validGroupOptions.length === 0) return null;
          
          return (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && <Separator />}
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {group.name}
              </div>
              {validGroupOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
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
  );
}
