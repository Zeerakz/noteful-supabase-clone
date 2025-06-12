
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SelectFieldSettings } from '@/types/database';

interface SelectFieldDisplayProps {
  value: string | null;
  settings: SelectFieldSettings;
  multiSelect?: boolean;
}

export function SelectFieldDisplay({ value, settings, multiSelect = false }: SelectFieldDisplayProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const options = settings.options || [];
  
  if (multiSelect) {
    const selectedIds = value.split(',').filter(id => id.trim() !== '');
    const selectedOptions = selectedIds
      .map(id => options.find(opt => opt.id === id.trim()))
      .filter(Boolean);
    
    if (selectedOptions.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {selectedOptions.map((option) => (
          <Badge 
            key={option!.id} 
            variant="secondary" 
            className="text-xs bg-muted text-muted-foreground border-border"
          >
            {option!.name}
          </Badge>
        ))}
      </div>
    );
  }

  const selectedOption = options.find(opt => opt.id === value);
  
  if (!selectedOption) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Badge 
      variant="secondary" 
      className="text-xs bg-muted text-muted-foreground border-border"
    >
      {selectedOption.name}
    </Badge>
  );
}
