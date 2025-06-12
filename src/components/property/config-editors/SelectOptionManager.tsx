import React, { useState, useRef, useEffect } from 'react';
import { SelectOption } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOptionManagerProps {
  options: SelectOption[];
  onOptionsChange: (options: SelectOption[]) => void;
  label?: string;
  placeholder?: string;
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#0f172a', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0891b2', '#2563eb',
  '#7c3aed', '#c2410c', '#65a30d', '#0d9488'
];

export function SelectOptionManager({ 
  options = [], 
  onOptionsChange, 
  label = "Options",
  placeholder = "Enter option name"
}: SelectOptionManagerProps) {
  const [newOptionName, setNewOptionName] = useState('');
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [draggedOption, setDraggedOption] = useState<SelectOption | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingOptionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingOptionId]);

  const getRandomColor = () => {
    const usedColors = options.map(opt => opt.color).filter(Boolean);
    const availableColors = DEFAULT_COLORS.filter(color => !usedColors.includes(color));
    
    if (availableColors.length === 0) {
      // If all colors are used, pick a random one
      return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
    }
    
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  };

  const addOption = () => {
    if (!newOptionName.trim()) return;

    const newOption: SelectOption = {
      id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newOptionName.trim(),
      color: getRandomColor()
    };

    const updatedOptions = [...options, newOption];
    onOptionsChange(updatedOptions);
    setNewOptionName('');
  };

  const updateOption = (optionId: string, updates: Partial<SelectOption>) => {
    const updatedOptions = options.map(option =>
      option.id === optionId ? { ...option, ...updates } : option
    );
    onOptionsChange(updatedOptions);
    
    if (updates.name !== undefined) {
      setEditingOptionId(null);
    }
  };

  const removeOption = (optionId: string) => {
    const updatedOptions = options.filter(option => option.id !== optionId);
    onOptionsChange(updatedOptions);
  };

  const cycleColor = (optionId: string) => {
    const option = options.find(opt => opt.id === optionId);
    if (!option) return;
    
    const currentIndex = DEFAULT_COLORS.indexOf(option.color || '');
    const nextIndex = (currentIndex + 1) % DEFAULT_COLORS.length;
    const newColor = DEFAULT_COLORS[nextIndex];
    
    updateOption(optionId, { color: newColor });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOption();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, optionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setEditingOptionId(null);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingOptionId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, option: SelectOption) => {
    setDraggedOption(option);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedOption) return;
    
    const sourceIndex = options.findIndex(opt => opt.id === draggedOption.id);
    if (sourceIndex === -1 || sourceIndex === targetIndex) return;
    
    const newOptions = [...options];
    const [removed] = newOptions.splice(sourceIndex, 1);
    newOptions.splice(targetIndex, 0, removed);
    
    onOptionsChange(newOptions);
    setDraggedOption(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedOption(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Add new option */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={newOptionName}
          onChange={(e) => setNewOptionName(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button 
          onClick={addOption} 
          size="sm" 
          disabled={!newOptionName.trim()}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Existing options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={option.id}
            draggable
            onDragStart={(e) => handleDragStart(e, option)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2 p-2 border rounded group transition-all duration-200",
              "hover:border-border/60 hover:bg-accent/50",
              dragOverIndex === index && "border-primary bg-primary/10",
              draggedOption?.id === option.id && "opacity-50"
            )}
          >
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
            
            <div 
              className="w-4 h-4 rounded-full border cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: option.color }}
              onClick={() => cycleColor(option.id)}
              title="Click to change color"
            />
            
            {editingOptionId === option.id ? (
              <Input
                ref={editInputRef}
                value={option.name}
                onChange={(e) => updateOption(option.id, { name: e.target.value })}
                onKeyDown={(e) => handleEditKeyDown(e, option.id)}
                onBlur={() => setEditingOptionId(null)}
                className="flex-1 h-8"
              />
            ) : (
              <div
                className="flex-1 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded"
                onClick={() => setEditingOptionId(option.id)}
                title="Click to edit"
              >
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium border-border/50"
                  style={{ 
                    backgroundColor: `${option.color}20`,
                    borderColor: option.color,
                    color: option.color
                  }}
                >
                  {option.name}
                </Badge>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => removeOption(option.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {options.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No options yet. Add your first option above.
        </div>
      )}
      
      {options.length > 0 && (
        <div className="text-xs text-muted-foreground">
          💡 Tip: Drag to reorder • Click color to change • Click name to edit
        </div>
      )}
    </div>
  );
}
