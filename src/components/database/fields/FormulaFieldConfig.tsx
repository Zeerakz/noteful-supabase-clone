
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormulaFieldSettings, DatabaseField } from '@/types/database';

interface FormulaFieldConfigProps {
  settings: FormulaFieldSettings;
  onSettingsChange: (settings: FormulaFieldSettings) => void;
  availableFields: DatabaseField[];
}

export function FormulaFieldConfig({ settings, onSettingsChange, availableFields }: FormulaFieldConfigProps) {
  const [formula, setFormula] = useState(settings.formula || '');
  const [returnType, setReturnType] = useState(settings.return_type || 'text');

  useEffect(() => {
    onSettingsChange({
      ...settings,
      formula,
      return_type: returnType,
    });
  }, [formula, returnType]);

  const handleFormulaChange = (value: string) => {
    setFormula(value);
  };

  const handleReturnTypeChange = (value: 'number' | 'text' | 'date' | 'boolean') => {
    setReturnType(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="formula">Formula</Label>
        <Input
          id="formula"
          placeholder="e.g., field1 + field2"
          value={formula}
          onChange={(e) => handleFormulaChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use field names to reference other fields. Available fields: {availableFields.map(f => f.name).join(', ')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="return-type">Return Type</Label>
        <Select value={returnType} onValueChange={handleReturnTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select return type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
