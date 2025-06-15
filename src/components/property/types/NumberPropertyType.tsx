
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { NumberPropertyConfig } from '@/types/property';
import { NumberPropertyConfigEditor } from '../config-editors/NumberPropertyConfigEditor';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Hash, Percent, DollarSign } from 'lucide-react';

// Display component for number fields
const NumberFieldDisplay: React.FC<{
  value: any;
  config: NumberPropertyConfig;
  inTable?: boolean;
}> = ({ value, config, inTable = false }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return <span className="text-muted-foreground">—</span>;
  }
  
  const formatNumber = (num: number): string => {
    if (config.precision !== undefined) {
      return num.toFixed(config.precision);
    }
    return num.toString();
  };
  
  const formatCurrency = (num: number): string => {
    const formatted = formatNumber(num);
    const prefix = config.prefix || '$';
    const suffix = config.suffix || '';
    return `${prefix}${formatted}${suffix}`;
  };
  
  const formatPercentage = (num: number): string => {
    const percentValue = config.format === 'percentage' ? num : num * 100;
    const formatted = formatNumber(percentValue);
    return `${formatted}%`;
  };
  
  // Handle different display formats
  switch (config.displayAs) {
    case 'currency':
      return (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground font-mono">
            {formatCurrency(numValue)}
          </span>
        </div>
      );
    
    case 'percentage':
      return (
        <div className="flex items-center gap-1">
          <Percent className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground font-mono">
            {formatPercentage(numValue)}
          </span>
        </div>
      );
    
    case 'progress':
      const progressValue = Math.min(Math.max(numValue, config.min || 0), config.max || 100);
      const progressPercentage = config.max ? (progressValue / config.max) * 100 : progressValue;
      
      return (
        <div className="flex items-center gap-2 w-full">
          <Progress 
            value={progressPercentage} 
            className="flex-1 h-2"
          />
          <span className="text-xs text-muted-foreground font-mono min-w-[3rem] text-right">
            {config.showPercentage ? `${Math.round(progressPercentage)}%` : formatNumber(progressValue)}
          </span>
        </div>
      );

    case 'ring':
      const ringValue = Math.min(Math.max(numValue, config.min || 0), config.max || 100);
      const ringPercentage = config.max ? (ringValue / config.max) * 100 : ringValue;
      const radius = 12;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (ringPercentage / 100) * circumference;

      return (
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8" viewBox="0 0 32 32">
            <circle
              className="text-muted"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="16"
              cy="16"
            />
            <circle
              className="text-primary"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="16"
              cy="16"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          {config.showPercentage && (
            <span className="text-xs text-muted-foreground font-mono">
              {`${Math.round(ringPercentage)}%`}
            </span>
          )}
        </div>
      );
    
    case 'plain':
    default:
      const displayValue = config.format === 'percentage' ? formatPercentage(numValue) : formatNumber(numValue);
      const prefix = config.prefix || '';
      const suffix = config.suffix || '';
      
      return (
        <span className="text-foreground font-mono">
          {prefix}{displayValue}{suffix}
        </span>
      );
  }
};

// Editor component for number fields
const NumberFieldEditor: React.FC<{
  value: any;
  config: NumberPropertyConfig;
  onChange: (value: any) => void;
}> = ({ value, config, onChange }) => {
  const [localValue, setLocalValue] = React.useState(value?.toString() || '');
  
  const handleBlur = () => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let constrainedValue = numValue;
      if (config.min !== undefined && constrainedValue < config.min) {
        constrainedValue = config.min;
      }
      if (config.max !== undefined && constrainedValue > config.max) {
        constrainedValue = config.max;
      }
      onChange(constrainedValue);
      setLocalValue(constrainedValue.toString());
    } else if (localValue === '') {
      onChange(null);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setLocalValue(value?.toString() || '');
    }
  };
  
  const getPlaceholder = () => {
    if (config.displayAs === 'percentage') {
      return config.format === 'percentage' ? '0-100' : '0.0-1.0';
    }
    if (config.min !== undefined && config.max !== undefined) {
      return `${config.min}-${config.max}`;
    }
    if (config.min !== undefined) {
      return `Min: ${config.min}`;
    }
    if (config.max !== undefined) {
      return `Max: ${config.max}`;
    }
    return 'Enter number';
  };
  
  return (
    <Input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={getPlaceholder()}
      min={config.min}
      max={config.max}
      step={config.step || (config.format === 'integer' ? 1 : 0.01)}
      className="border-none bg-transparent p-1 focus-visible:ring-1 font-mono"
      autoFocus
    />
  );
};

// Property type definition
export const numberPropertyType: PropertyTypeDefinition<NumberPropertyConfig> = {
  type: 'number',
  label: 'Number',
  description: 'Numeric values with various display formats',
  icon: <Hash className="h-4 w-4" />,
  category: 'basic',
  
  getDefaultConfig: () => ({
    required: false,
    format: 'decimal',
    precision: 2,
    displayAs: 'plain',
    showPercentage: false,
  }),
  
  validateConfig: (config) => {
    const errors: string[] = [];
    
    if (config.min !== undefined && config.max !== undefined) {
      if (config.min > config.max) {
        errors.push('Minimum value cannot be greater than maximum value');
      }
    }
    
    if (config.precision !== undefined && (config.precision < 0 || config.precision > 10)) {
      errors.push('Precision must be between 0 and 10');
    }
    
    if (config.step !== undefined && config.step <= 0) {
      errors.push('Step must be greater than 0');
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  getDefaultValue: (config) => config.defaultValue || null,
  
  validateValue: (value, config) => {
    const errors: string[] = [];
    
    if (value === null || value === undefined || value === '') {
      if (config.required) {
        errors.push('This field is required');
      }
      return { isValid: errors.length === 0, errors };
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      errors.push('Must be a valid number');
      return { isValid: false, errors };
    }
    
    if (config.min !== undefined && numValue < config.min) {
      errors.push(`Value must be at least ${config.min}`);
    }
    
    if (config.max !== undefined && numValue > config.max) {
      errors.push(`Value must be at most ${config.max}`);
    }
    
    if (config.format === 'integer' && !Number.isInteger(numValue)) {
      errors.push('Value must be a whole number');
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  formatValue: (value, config) => {
    if (value === null || value === undefined) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    if (config.precision !== undefined) {
      return numValue.toFixed(config.precision);
    }
    return numValue.toString();
  },
  
  parseValue: (input, config) => {
    if (!input || input.trim() === '') return null;
    const numValue = parseFloat(input);
    return isNaN(numValue) ? null : numValue;
  },
  
  ConfigEditor: NumberPropertyConfigEditor,
  FieldDisplay: NumberFieldDisplay,
  FieldEditor: NumberFieldEditor,
  
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: false,
  
  exportValue: (value, config) => {
    if (value === null || value === undefined) return '';
    return parseFloat(value).toString();
  },
  
  importValue: (input, config) => {
    if (!input || input.trim() === '') return null;
    const numValue = parseFloat(input);
    return isNaN(numValue) ? null : numValue;
  },
  
  searchableText: (value, config) => {
    if (value === null || value === undefined) return '';
    return parseFloat(value).toString();
  },
};
