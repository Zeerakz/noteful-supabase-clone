
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { FilterRule } from '@/types/filters';
import { DatabaseField } from '@/types/database';
import { ME_FILTER_VALUE, isMeFilter } from '@/utils/relativeFilters';

interface PersonFilterEditorProps {
  rule: FilterRule;
  field: DatabaseField;
  onUpdate: (rule: FilterRule) => void;
}

export function PersonFilterEditor({ rule, field, onUpdate }: PersonFilterEditorProps) {
  const handleValueChange = (value: string) => {
    onUpdate({ ...rule, value });
  };

  const handleMeFilterSelect = () => {
    onUpdate({ ...rule, value: ME_FILTER_VALUE });
  };

  const handleSelectChange = (value: string) => {
    // Only proceed if the value is not empty and is a valid option
    if (!value || value.trim() === '') {
      console.warn('PersonFilterEditor: Attempted to select empty value');
      return;
    }
    
    if (value === 'me') {
      handleMeFilterSelect();
    } else if (value === 'custom') {
      handleValueChange('');
    }
  };

  const isMe = isMeFilter(rule);

  // Ensure we have valid select options
  const selectOptions = [
    { value: 'me', label: 'Me', icon: User },
    { value: 'custom', label: 'Custom' }
  ].filter(option => option.value && option.value.trim() !== '');

  return (
    <div className="flex items-center gap-2">
      {rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && (
        <>
          <Select value={isMe ? 'me' : 'custom'} onValueChange={handleSelectChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-3 w-3" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isMe ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Me (Current User)
            </Badge>
          ) : (
            <Input
              placeholder="Enter user name or email"
              value={rule.value}
              onChange={(e) => handleValueChange(e.target.value)}
              className="flex-1"
            />
          )}
        </>
      )}
    </div>
  );
}
