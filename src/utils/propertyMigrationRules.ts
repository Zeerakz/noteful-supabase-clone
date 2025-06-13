
import { MigrationRule } from '@/types/propertyMigration';

export const migrationRules: MigrationRule[] = [
  // Text to Date
  {
    fromType: 'text',
    toType: 'date',
    isLossy: true,
    warnings: ['Only valid date formats will be preserved', 'Free-form text will be lost'],
    converter: (value: string) => {
      if (!value || value.trim() === '') {
        return { success: true, value: '' };
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { success: false, value: '', error: 'Invalid date format' };
      }
      
      return { success: true, value: date.toISOString().split('T')[0] };
    }
  },
  
  // Text to Number
  {
    fromType: 'text',
    toType: 'number',
    isLossy: true,
    warnings: ['Only numeric text will be preserved', 'Non-numeric text will be lost'],
    converter: (value: string) => {
      if (!value || value.trim() === '') {
        return { success: true, value: '' };
      }
      
      const num = parseFloat(value.trim());
      if (isNaN(num)) {
        return { success: false, value: '', error: 'Not a valid number' };
      }
      
      return { success: true, value: num.toString() };
    }
  },
  
  // Number to Text
  {
    fromType: 'number',
    toType: 'text',
    isLossy: false,
    warnings: [],
    converter: (value: string) => {
      return { success: true, value: value || '' };
    }
  },
  
  // Date to Text
  {
    fromType: 'date',
    toType: 'text',
    isLossy: false,
    warnings: [],
    converter: (value: string) => {
      if (!value) return { success: true, value: '' };
      
      try {
        const date = new Date(value);
        return { success: true, value: date.toLocaleDateString() };
      } catch {
        return { success: true, value: value };
      }
    }
  },
  
  // Text to Checkbox
  {
    fromType: 'text',
    toType: 'checkbox',
    isLossy: true,
    warnings: ['Only true/false, yes/no, 1/0 values will be preserved', 'Other text will default to false'],
    converter: (value: string) => {
      if (!value || value.trim() === '') {
        return { success: true, value: 'false' };
      }
      
      const normalized = value.toLowerCase().trim();
      const truthyValues = ['true', 'yes', '1', 'on', 'checked'];
      const falsyValues = ['false', 'no', '0', 'off', 'unchecked'];
      
      if (truthyValues.includes(normalized)) {
        return { success: true, value: 'true' };
      } else if (falsyValues.includes(normalized)) {
        return { success: true, value: 'false' };
      } else {
        return { success: false, value: 'false', error: 'Cannot determine boolean value' };
      }
    }
  },
  
  // Checkbox to Text
  {
    fromType: 'checkbox',
    toType: 'text',
    isLossy: false,
    warnings: [],
    converter: (value: string) => {
      if (value === 'true') return { success: true, value: 'Yes' };
      if (value === 'false') return { success: true, value: 'No' };
      return { success: true, value: value || 'No' };
    }
  },
  
  // Text to URL
  {
    fromType: 'text',
    toType: 'url',
    isLossy: true,
    warnings: ['Only valid URLs will be preserved', 'Invalid URLs will be lost'],
    converter: (value: string) => {
      if (!value || value.trim() === '') {
        return { success: true, value: '' };
      }
      
      try {
        // Try to create a URL object to validate
        new URL(value);
        return { success: true, value: value };
      } catch {
        // Try adding http:// if it's missing
        try {
          new URL('http://' + value);
          return { success: true, value: 'http://' + value };
        } catch {
          return { success: false, value: '', error: 'Invalid URL format' };
        }
      }
    }
  },
  
  // URL to Text
  {
    fromType: 'url',
    toType: 'text',
    isLossy: false,
    warnings: [],
    converter: (value: string) => {
      return { success: true, value: value || '' };
    }
  },
  
  // Text to Email
  {
    fromType: 'text',
    toType: 'email',
    isLossy: true,
    warnings: ['Only valid email addresses will be preserved', 'Invalid emails will be lost'],
    converter: (value: string) => {
      if (!value || value.trim() === '') {
        return { success: true, value: '' };
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value.trim())) {
        return { success: true, value: value.trim() };
      } else {
        return { success: false, value: '', error: 'Invalid email format' };
      }
    }
  },
  
  // Email to Text
  {
    fromType: 'email',
    toType: 'text',
    isLossy: false,
    warnings: [],
    converter: (value: string) => {
      return { success: true, value: value || '' };
    }
  }
];

export function getMigrationRule(fromType: string, toType: string): MigrationRule | null {
  return migrationRules.find(rule => rule.fromType === fromType && rule.toType === toType) || null;
}

export function isMigrationSupported(fromType: string, toType: string): boolean {
  return migrationRules.some(rule => rule.fromType === fromType && rule.toType === toType);
}
