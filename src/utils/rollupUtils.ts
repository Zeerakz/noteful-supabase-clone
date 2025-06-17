
import { DatabaseField, RollupFieldSettings } from '@/types/database';

export interface RollupDisplayInfo {
  aggregationType: string;
  targetProperty: string;
  relationField: string;
  description: string;
}

export function getRollupDisplayInfo(
  rollupField: DatabaseField,
  allFields: DatabaseField[]
): RollupDisplayInfo {
  const settings = rollupField.settings as RollupFieldSettings;
  
  if (!settings) {
    return {
      aggregationType: 'unknown',
      targetProperty: 'unknown',
      relationField: 'unknown',
      description: 'Invalid rollup configuration'
    };
  }

  // Find the relation field
  const relationField = allFields.find(f => f.id === settings.relation_field_id);
  const relationFieldName = relationField?.name || 'Unknown relation';

  // Get target property name (could be a special value like 'count' or 'title')
  let targetPropertyName = settings.rollup_property;
  if (settings.rollup_property === 'count') {
    targetPropertyName = 'Count of items';
  } else if (settings.rollup_property === 'title') {
    targetPropertyName = 'Page titles';
  } else {
    // Try to find the actual property name from target database fields
    // For now, we'll use the ID as fallback
    targetPropertyName = settings.rollup_property || 'Unknown property';
  }

  const aggregationDisplayName = getAggregationDisplayName(settings.aggregation);
  
  const description = `${aggregationDisplayName} of "${targetPropertyName}" from related "${relationFieldName}"`;

  return {
    aggregationType: aggregationDisplayName,
    targetProperty: targetPropertyName,
    relationField: relationFieldName,
    description
  };
}

export function getAggregationDisplayName(aggregation: string): string {
  const aggregationNames: Record<string, string> = {
    'sum': 'Sum',
    'count': 'Count',
    'average': 'Average',
    'min': 'Minimum',
    'max': 'Maximum',
    'earliest': 'Earliest date',
    'latest': 'Latest date'
  };
  
  return aggregationNames[aggregation] || aggregation;
}

export function formatRollupValue(value: string | null, aggregation: string): string {
  if (value === null || value === undefined || value === '') {
    return getDefaultDisplayValue(aggregation);
  }
  
  // Try to parse as number for numeric aggregations
  if (['sum', 'count', 'average', 'min', 'max'].includes(aggregation)) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Format count as integer
      if (aggregation === 'count') {
        return Math.floor(numValue).toString();
      }
      // Format others with appropriate decimal places
      if (numValue === Math.floor(numValue)) {
        return numValue.toString();
      } else {
        return numValue.toFixed(2);
      }
    }
  }
  
  // Handle date aggregations
  if (['earliest', 'latest'].includes(aggregation)) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    } catch {
      // Fall through to default
    }
  }
  
  return value;
}

export function getDefaultDisplayValue(aggregation: string): string {
  switch (aggregation) {
    case 'count':
    case 'sum':
      return '0';
    case 'average':
    case 'min':
    case 'max':
      return '—';
    case 'earliest':
    case 'latest':
      return '—';
    default:
      return '—';
  }
}

export function getRollupIcon(aggregation: string): string {
  switch (aggregation) {
    case 'sum':
      return '∑';
    case 'count':
      return '#';
    case 'average':
      return '~';
    case 'min':
      return '↓';
    case 'max':
      return '↑';
    case 'earliest':
      return '◀';
    case 'latest':
      return '▶';
    default:
      return '⚡';
  }
}
