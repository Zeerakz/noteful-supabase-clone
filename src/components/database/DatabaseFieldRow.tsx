
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { FIELD_TYPES } from './databaseFieldTypes';

export interface DatabaseField {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

interface DatabaseFieldRowProps {
  field: DatabaseField;
  isCreating: boolean;
  canBeDeleted: boolean;
  onUpdateField: (id: string, updates: Partial<DatabaseField>) => void;
  onRemoveField: (id: string) => void;
}

export function DatabaseFieldRow({
  field,
  isCreating,
  canBeDeleted,
  onUpdateField,
  onRemoveField,
}: DatabaseFieldRowProps) {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Label className="text-xs">Field Name</Label>
        <Input
          placeholder="Field name"
          value={field.name}
          onChange={(e) => onUpdateField(field.id, { name: e.target.value })}
          disabled={isCreating}
        />
      </div>
      
      <div className="w-40">
        <Label className="text-xs">Type</Label>
        <Select
          value={field.type}
          onValueChange={(value) => onUpdateField(field.id, { type: value })}
          disabled={isCreating}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-24">
        <Label className="text-xs">Required</Label>
        <Select
          value={field.nullable ? 'optional' : 'required'}
          onValueChange={(value) => onUpdateField(field.id, { nullable: value === 'optional' })}
          disabled={isCreating}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="required">Required</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {canBeDeleted && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemoveField(field.id)}
          className="text-destructive hover:text-destructive"
          disabled={isCreating}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
