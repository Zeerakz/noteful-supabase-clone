
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SelectFieldSettings } from '@/types/database';
import { Plus, X } from 'lucide-react';

interface SelectFieldConfigProps {
  settings: SelectFieldSettings;
  onSettingsChange: (settings: SelectFieldSettings) => void;
}

export function SelectFieldConfig({ settings, onSettingsChange }: SelectFieldConfigProps) {
  const [options, setOptions] = useState(settings.options || []);
  const [newOptionName, setNewOptionName] = useState('');

  useEffect(() => {
    onSettingsChange({ options });
  }, [options, onSettingsChange]);

  const addOption = () => {
    if (!newOptionName.trim()) return;
    
    const newOption = {
      id: crypto.randomUUID(),
      name: newOptionName.trim(),
      color: getNextColor(),
    };
    
    setOptions([...options, newOption]);
    setNewOptionName('');
  };

  const removeOption = (optionId: string) => {
    setOptions(options.filter(option => option.id !== optionId));
  };

  const getNextColor = () => {
    const colors = ['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'indigo', 'gray'];
    return colors[options.length % colors.length];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOption();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Options</Label>
        
        <div className="flex gap-2">
          <Input
            placeholder="Add an option"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button 
            type="button" 
            size="sm" 
            onClick={addOption}
            disabled={!newOptionName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {options.length > 0 && (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-2 border rounded">
                <Badge variant="outline" className="text-xs">
                  {option.name}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Create options for users to select from.
        </p>
      </div>
    </div>
  );
}
