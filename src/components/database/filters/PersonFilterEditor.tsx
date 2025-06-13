
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
    // Only proceed if the value is not empty
    if (value && value.trim() !== '') {
      if (value === 'me') {
        handleMeFilterSelect();
      } else {
        handleValueChange('');
      }
    }
  };

  const isMe = isMeFilter(rule);

  return (
    <div className="flex items-center gap-2">
      {rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && (
        <>
          <Select value={isMe ? 'me' : 'custom'} onValueChange={handleSelectChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="me">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  Me
                </div>
              </SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
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
