
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
  const selectedOption = allOptions.find(opt => opt.id === value);

  return (
    <Select value={value || ''} onValueChange={onChange}>
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
        {config.groups?.map((group, groupIndex) => (
          <React.Fragment key={group.id}>
            {groupIndex > 0 && <Separator />}
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {group.name}
            </div>
            {group.options?.map((option) => (
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
        ))}
      </SelectContent>
    </Select>
  );
}
