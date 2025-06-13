
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SelectFieldSettings } from '@/types/database';

interface SelectFieldEditorProps {
  value: string | null;
  settings: SelectFieldSettings;
  onChange: (value: string) => void;
  multiSelect?: boolean;
}

export function SelectFieldEditor({ value, settings, onChange, multiSelect = false }: SelectFieldEditorProps) {
  const options = settings.options || [];
  
  // Filter out options with empty IDs to prevent Select.Item errors
  const validOptions = options.filter(option => option.id && option.id.trim() !== '');
  
  const selectedValues = multiSelect && value ? value.split(',') : [];
  
  const handleSingleSelect = (newValue: string) => {
    onChange(newValue);
  };

  const handleMultiSelect = (optionId: string) => {
    if (!multiSelect) return;
    
    const currentValues = value ? value.split(',') : [];
    const isSelected = currentValues.includes(optionId);
    
    let newValues;
    if (isSelected) {
      newValues = currentValues.filter(v => v !== optionId);
    } else {
      newValues = [...currentValues, optionId];
    }
    
    onChange(newValues.join(','));
  };

  if (multiSelect) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((valueId) => {
            const option = validOptions.find(opt => opt.id === valueId);
            if (!option) return null;
            
            return (
              <Badge 
                key={valueId} 
                variant="outline" 
                className="text-xs cursor-pointer"
                onClick={() => handleMultiSelect(valueId)}
              >
                {option.name}
                <span className="ml-1">×</span>
              </Badge>
            );
          })}
        </div>
        
        <Select onValueChange={handleMultiSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select options..." />
          </SelectTrigger>
          <SelectContent>
            {validOptions.map((option) => (
              <SelectItem 
                key={option.id} 
                value={option.id}
                disabled={selectedValues.includes(option.id)}
              >
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Select value={value || ''} onValueChange={handleSingleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select an option..." />
      </SelectTrigger>
      <SelectContent>
        {validOptions.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
