
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Parentheses } from 'lucide-react';
import { FilterGroup, FilterGroupOperator } from '@/types/filters';
import { DatabaseField } from '@/types/database';
import { FilterRuleEditor } from './FilterRuleEditor';
import { createEmptyFilterRule, createEmptyFilterGroup } from '@/utils/filterUtils';

interface FilterGroupEditorProps {
  group: FilterGroup;
  fields: DatabaseField[];
  onUpdate: (group: FilterGroup) => void;
  onRemove?: () => void;
  depth?: number;
}

export function FilterGroupEditor({ group, fields, onUpdate, onRemove, depth = 0 }: FilterGroupEditorProps) {
  const handleOperatorChange = (operator: FilterGroupOperator) => {
    onUpdate({ ...group, operator });
  };

  const handleRuleUpdate = (ruleIndex: number, updatedRule: FilterGroup['rules'][0]) => {
    const newRules = [...group.rules];
    newRules[ruleIndex] = updatedRule;
    onUpdate({ ...group, rules: newRules });
  };

  const handleRuleRemove = (ruleIndex: number) => {
    const newRules = group.rules.filter((_, index) => index !== ruleIndex);
    onUpdate({ ...group, rules: newRules });
  };

  const handleGroupUpdate = (groupIndex: number, updatedGroup: FilterGroup) => {
    const newGroups = [...group.groups];
    newGroups[groupIndex] = updatedGroup;
    onUpdate({ ...group, groups: newGroups });
  };

  const handleGroupRemove = (groupIndex: number) => {
    const newGroups = group.groups.filter((_, index) => index !== groupIndex);
    onUpdate({ ...group, groups: newGroups });
  };

  const addRule = () => {
    onUpdate({
      ...group,
      rules: [...group.rules, createEmptyFilterRule(fields[0]?.id)]
    });
  };

  const addGroup = () => {
    onUpdate({
      ...group,
      groups: [...group.groups, createEmptyFilterGroup()]
    });
  };

  const hasContent = group.rules.length > 0 || group.groups.length > 0;
  const showOperatorSelector = hasContent && (group.rules.length + group.groups.length) > 1;

  return (
    <div className={`space-y-3 ${depth > 0 ? 'border-l-2 border-muted-foreground/20 pl-4 ml-2' : ''}`}>
      {/* Group Header */}
      <div className="flex items-center gap-2">
        {depth > 0 && (
          <Parentheses className="h-4 w-4 text-muted-foreground" />
        )}
        
        {showOperatorSelector && (
          <Select value={group.operator} onValueChange={handleOperatorChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
        )}

        {depth > 0 && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="p-1 h-auto text-muted-foreground hover:text-destructive ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Rules */}
      {group.rules.map((rule, index) => (
        <div key={rule.id}>
          {index > 0 && showOperatorSelector && (
            <div className="text-sm text-muted-foreground font-medium py-2">
              {group.operator}
            </div>
          )}
          <FilterRuleEditor
            rule={rule}
            fields={fields}
            onUpdate={(updatedRule) => handleRuleUpdate(index, updatedRule)}
            onRemove={() => handleRuleRemove(index)}
          />
        </div>
      ))}

      {/* Nested Groups */}
      {group.groups.map((subGroup, index) => (
        <div key={subGroup.id}>
          {(group.rules.length > 0 || index > 0) && showOperatorSelector && (
            <div className="text-sm text-muted-foreground font-medium py-2">
              {group.operator}
            </div>
          )}
          <FilterGroupEditor
            group={subGroup}
            fields={fields}
            onUpdate={(updatedGroup) => handleGroupUpdate(index, updatedGroup)}
            onRemove={() => handleGroupRemove(index)}
            depth={depth + 1}
          />
        </div>
      ))}

      {/* Add Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={addRule}
          className="gap-2"
        >
          <Plus className="h-3 w-3" />
          Add Rule
        </Button>
        
        {depth < 3 && ( // Limit nesting depth
          <Button
            variant="outline"
            size="sm"
            onClick={addGroup}
            className="gap-2"
          >
            <Parentheses className="h-3 w-3" />
            Add Group
          </Button>
        )}
      </div>
    </div>
  );
}
