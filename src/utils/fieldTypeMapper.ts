
import { PropertyType } from '@/types/property';

// Map database field types to property types
export function mapDatabaseFieldTypeToPropertyType(fieldType: string): PropertyType {
  const typeMapping: Record<string, PropertyType> = {
    // Basic types
    'text': 'text',
    'varchar': 'text',
    'char': 'text',
    'string': 'text',
    
    // Numeric types
    'number': 'number',
    'integer': 'number',
    'int': 'number',
    'bigint': 'number',
    'decimal': 'number',
    'numeric': 'number',
    'float': 'number',
    'double': 'number',
    'real': 'number',
    
    // Date types
    'date': 'date',
    'datetime': 'date',
    'timestamp': 'date',
    'timestamp with time zone': 'date',
    'timestamptz': 'date',
    
    // Boolean types
    'boolean': 'checkbox',
    'bool': 'checkbox',
    'checkbox': 'checkbox',
    
    // Selection types
    'select': 'select',
    'multi_select': 'multi_select',
    'enum': 'select',
    
    // URL and contact types
    'url': 'url',
    'email': 'email',
    'phone': 'phone',
    
    // Advanced types
    'relation': 'relation',
    'formula': 'formula',
    'rollup': 'rollup',
    'file_attachment': 'file_attachment',
    'rich_text': 'rich_text',
    'status': 'status',
    'people': 'people',
    'rating': 'rating',
    'progress': 'progress',
    'currency': 'currency',
    'button': 'button',
  };

  // Normalize the field type (lowercase, remove spaces/underscores)
  const normalizedType = fieldType.toLowerCase().replace(/[_\s]/g, '');
  
  // Try exact match first
  if (typeMapping[fieldType.toLowerCase()]) {
    return typeMapping[fieldType.toLowerCase()];
  }
  
  // Try normalized match
  for (const [key, value] of Object.entries(typeMapping)) {
    if (key.replace(/[_\s]/g, '') === normalizedType) {
      return value;
    }
  }
  
  // Special handling for common variations
  if (normalizedType.includes('timestamp')) {
    return 'date';
  }
  
  if (normalizedType.includes('time')) {
    return 'date';
  }
  
  if (normalizedType.includes('date')) {
    return 'date';
  }
  
  if (normalizedType.includes('int') || normalizedType.includes('num')) {
    return 'number';
  }
  
  if (normalizedType.includes('bool') || normalizedType.includes('check')) {
    return 'checkbox';
  }
  
  // Default fallback
  console.warn(`Unknown field type: ${fieldType}, defaulting to text`);
  return 'text';
}

// Get the proper property type for a database field
export function getFieldPropertyType(field: { type: string; name?: string }): PropertyType {
  // First try to map by the field type
  let propertyType = mapDatabaseFieldTypeToPropertyType(field.type);
  
  // If we have a field name, use it for intelligent guessing
  if (field.name && propertyType === 'text') {
    const fieldNameLower = field.name.toLowerCase();
    
    // Date field name patterns
    if (fieldNameLower.includes('date') || 
        fieldNameLower.includes('time') || 
        fieldNameLower.includes('created') || 
        fieldNameLower.includes('updated') ||
        fieldNameLower.includes('due') ||
        fieldNameLower.includes('deadline')) {
      propertyType = 'date';
    }
    
    // Email field name patterns
    else if (fieldNameLower.includes('email')) {
      propertyType = 'email';
    }
    
    // URL field name patterns
    else if (fieldNameLower.includes('url') || 
             fieldNameLower.includes('link') || 
             fieldNameLower.includes('website')) {
      propertyType = 'url';
    }
    
    // Phone field name patterns
    else if (fieldNameLower.includes('phone') || 
             fieldNameLower.includes('tel') || 
             fieldNameLower.includes('mobile')) {
      propertyType = 'phone';
    }
    
    // Status field name patterns
    else if (fieldNameLower.includes('status') || 
             fieldNameLower.includes('state')) {
      propertyType = 'status';
    }
    
    // People field name patterns
    else if (fieldNameLower.includes('people') || 
             fieldNameLower.includes('user') || 
             fieldNameLower.includes('assign') ||
             fieldNameLower.includes('owner') ||
             fieldNameLower.includes('author') ||
             fieldNameLower.includes('creator')) {
      propertyType = 'people';
    }
  }
  
  return propertyType;
}
