
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Group, X } from 'lucide-react';
import { DatabaseField } from '@/types/database';

interface DatabaseGroupingControlsProps {
  fields: DatabaseField[];
  groupingFieldId?: string;
  onGroupingChange: (fieldId?: string) => void;
}

export function DatabaseGroupingControls({
  fields,
  groupingFieldId,
  onGroupingChange,
}: DatabaseGroupingControlsProps) {
  // Only show fields that can be grouped (select, multi_select, checkbox, etc.)
  const groupableFields = fields.filter(field => 
    ['select', 'multi_select', 'checkbox', 'text', 'number'].includes(field.type)
  );

  const handleGroupingChange = (value: string) => {
    if (value === 'none') {
      onGroupingChange(undefined);
    } else {
      onGroupingChange(value);
    }
  };

  const clearGrouping = () => {
    onGroupingChange(undefined);
  };

  return (
    <div className="flex items-center gap-2">
      <Group className="h-4 w-4 text-muted-foreground" />
      <Select value={groupingFieldId || 'none'} onValueChange={handleGroupingChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Group by field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No grouping</SelectItem>
          {groupableFields.map((field) => (
            <SelectItem key={field.id} value={field.id}>
              {field.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {groupingFieldId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearGrouping}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
