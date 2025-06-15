
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyType } from '@/types/property';
import { propertyRegistry } from '@/types/propertyRegistry';

interface RegistryBasedFieldTypeSelectorProps {
  value: PropertyType;
  onValueChange: (value: PropertyType) => void;
  disabled?: boolean;
}

export function RegistryBasedFieldTypeSelector({ 
  value, 
  onValueChange, 
  disabled 
}: RegistryBasedFieldTypeSelectorProps) {
  const categories = ['basic', 'advanced', 'computed', 'media', 'relationship'] as const;
  
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select field type" />
      </SelectTrigger>
      <SelectContent>
        {categories.map(category => {
          const typesInCategory = propertyRegistry.getAllByCategory(category).filter(def => def.type !== 'unsupported');
          if (typesInCategory.length === 0) return null;
          
          return (
            <div key={category}>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              {typesInCategory.map((definition) => (
                <SelectItem key={definition.type} value={definition.type}>
                  <div className="flex items-center space-x-2">
                    {definition.icon}
                    <div className="flex flex-col">
                      <span className="font-medium">{definition.label}</span>
                      <span className="text-xs text-muted-foreground">{definition.description}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}
