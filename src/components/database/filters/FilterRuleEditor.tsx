
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FilterRule, FILTER_OPERATORS } from '@/types/filters';
import { DatabaseField } from '@/types/database';
import { getOperatorsForFieldType, needsValue, needsSecondValue } from '@/utils/filterUtils';
import { PersonFilterEditor } from './PersonFilterEditor';

interface FilterRuleEditorProps {
  rule: FilterRule;
  fields: DatabaseField[];
  onUpdate: (rule: FilterRule) => void;
  onRemove: () => void;
}

export function FilterRuleEditor({ rule, fields, onUpdate, onRemove }: FilterRuleEditorProps) {
  const selectedField = fields.find(f => f.id === rule.fieldId);
  const availableOperators = selectedField 
    ? getOperatorsForFieldType(selectedField.type)
    : [];

  const handleFieldChange = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    const defaultOperator = field ? getOperatorsForFieldType(field.type)[0] : 'equals';
    
    onUpdate({
      ...rule,
      fieldId,
      operator: defaultOperator,
      value: '',
      value2: undefined
    });
  };

  const handleOperatorChange = (operator: FilterRule['operator']) => {
    onUpdate({
      ...rule,
      operator,
      value: needsSecondValue(operator) ? rule.value : rule.value,
      value2: needsSecondValue(operator) ? (rule.value2 || '') : undefined
    });
  };

  const handleValueChange = (value: string) => {
    onUpdate({ ...rule, value });
  };

  const handleValue2Change = (value2: string) => {
    onUpdate({ ...rule, value2 });
  };

  const isPersonField = selectedField?.type === 'person' || selectedField?.type === 'people';

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
      <Select value={rule.fieldId} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.id} value={field.id}>
              {field.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={rule.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((operator) => {
            const operatorData = FILTER_OPERATORS.find(op => op.value === operator);
            return (
              <SelectItem key={operator} value={operator}>
                {operatorData?.label || operator}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {needsValue(rule.operator) && (
        <>
          {isPersonField ? (
            <PersonFilterEditor
              rule={rule}
              field={selectedField!}
              onUpdate={onUpdate}
            />
          ) : (
            <Input
              placeholder="Value"
              value={rule.value}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-32"
              type={selectedField?.type === 'number' ? 'number' : selectedField?.type === 'date' ? 'date' : 'text'}
            />
          )}
        </>
      )}

      {needsSecondValue(rule.operator) && !isPersonField && (
        <>
          <span className="text-sm text-muted-foreground">and</span>
          <Input
            placeholder="Value 2"
            value={rule.value2 || ''}
            onChange={(e) => handleValue2Change(e.target.value)}
            className="w-32"
            type={selectedField?.type === 'number' ? 'number' : selectedField?.type === 'date' ? 'date' : 'text'}
          />
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="p-1 h-auto text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
