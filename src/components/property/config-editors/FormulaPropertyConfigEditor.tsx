
import React from 'react';
import { FormulaPropertyConfig, Property } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface FormulaPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: FormulaPropertyConfig) => void;
  availableProperties?: Property[];
}

export function FormulaPropertyConfigEditor({ config, onConfigChange, availableProperties = [] }: FormulaPropertyConfigEditorProps) {
  const formulaConfig = config as FormulaPropertyConfig;

  const updateConfig = (updates: Partial<FormulaPropertyConfig>) => {
    onConfigChange({ ...formulaConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="returnType">Return Type</Label>
        <Select value={formulaConfig.returnType || 'text'} onValueChange={(value) => updateConfig({ returnType: value as 'number' | 'text' | 'date' | 'boolean' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="formula">Formula</Label>
        <Textarea
          id="formula"
          value={formulaConfig.formula || ''}
          onChange={(e) => updateConfig({ formula: e.target.value })}
          placeholder="Enter your formula (e.g., prop('Price') * prop('Quantity'))"
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use prop('PropertyName') to reference other properties. Available functions: sum, average, min, max, concat, if, and, or, not.
        </p>
      </div>

      {availableProperties.length > 0 && (
        <div className="space-y-2">
          <Label>Available Properties</Label>
          <div className="flex flex-wrap gap-1 p-2 border rounded bg-muted/20">
            {availableProperties.map((property) => (
              <Badge 
                key={property.id} 
                variant="secondary" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  const newFormula = (formulaConfig.formula || '') + `prop('${property.name}')`;
                  updateConfig({ formula: newFormula });
                }}
              >
                {property.name}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Click on a property name to add it to your formula.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Formula Examples</Label>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div><code>prop('Price') * prop('Quantity')</code> - Multiply two number properties</div>
          <div><code>concat(prop('First Name'), ' ', prop('Last Name'))</code> - Combine text fields</div>
          <div><code>if(prop('Status') == 'Complete', 'Done', 'In Progress')</code> - Conditional logic</div>
          <div><code>sum(prop('Subtotal'), prop('Tax'))</code> - Add numbers</div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formulaConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
