
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldType } from '@/types/database';
import { 
  Type, 
  Hash, 
  List, 
  Calendar, 
  CheckSquare, 
  Link, 
  Mail, 
  Phone, 
  ArrowRightLeft,
  Calculator,
  TrendingUp,
  Tag,
  CheckCircle
} from 'lucide-react';

interface FieldTypeSelectorProps {
  value: FieldType;
  onValueChange: (value: FieldType) => void;
  disabled?: boolean;
}

const fieldTypeOptions: { value: FieldType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'text', label: 'Text', icon: <Type className="h-4 w-4" />, description: 'Single line of text' },
  { value: 'number', label: 'Number', icon: <Hash className="h-4 w-4" />, description: 'Numeric values' },
  { value: 'select', label: 'Select', icon: <Tag className="h-4 w-4" />, description: 'Single option from a list' },
  { value: 'multi_select', label: 'Multi-select', icon: <List className="h-4 w-4" />, description: 'Multiple options from a list' },
  { value: 'status', label: 'Status', icon: <CheckCircle className="h-4 w-4" />, description: 'Track progress through stages' },
  { value: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" />, description: 'Date and time' },
  { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" />, description: 'True/false values' },
  { value: 'url', label: 'URL', icon: <Link className="h-4 w-4" />, description: 'Web links' },
  { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" />, description: 'Email addresses' },
  { value: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" />, description: 'Phone numbers' },
  { value: 'relation', label: 'Relation', icon: <ArrowRightLeft className="h-4 w-4" />, description: 'Link to another database' },
  { value: 'formula', label: 'Formula', icon: <Calculator className="h-4 w-4" />, description: 'Calculated values based on other fields' },
  { value: 'rollup', label: 'Rollup', icon: <TrendingUp className="h-4 w-4" />, description: 'Aggregate values from related records' },
];

export function FieldTypeSelector({ value, onValueChange, disabled }: FieldTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select field type" />
      </SelectTrigger>
      <SelectContent>
        {fieldTypeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center space-x-2">
              {option.icon}
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
