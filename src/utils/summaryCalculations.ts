
import { DatabaseField } from '@/types/database';
import { GroupedItem } from '@/types/grouping';
import { parseISO, isValid, format } from 'date-fns';

export interface SummaryResult {
  type: 'number' | 'date';
  sum?: number;
  average?: number;
  min?: number | Date;
  max?: number | Date;
  count: number;
  validCount: number; // Count of non-empty values
}

export function calculateNumberSummary(items: GroupedItem[], fieldId: string): SummaryResult {
  const values = items
    .map(item => {
      const value = item.properties[fieldId];
      return value ? parseFloat(value) : null;
    })
    .filter(value => value !== null && !isNaN(value as number)) as number[];

  if (values.length === 0) {
    return {
      type: 'number',
      count: items.length,
      validCount: 0
    };
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    type: 'number',
    sum,
    average,
    min,
    max,
    count: items.length,
    validCount: values.length
  };
}

export function calculateDateSummary(items: GroupedItem[], fieldId: string): SummaryResult {
  const dates = items
    .map(item => {
      const value = item.properties[fieldId];
      if (!value) return null;
      const date = parseISO(value);
      return isValid(date) ? date : null;
    })
    .filter(date => date !== null) as Date[];

  if (dates.length === 0) {
    return {
      type: 'date',
      count: items.length,
      validCount: 0
    };
  }

  const timestamps = dates.map(date => date.getTime());
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);

  return {
    type: 'date',
    min: new Date(minTimestamp),
    max: new Date(maxTimestamp),
    count: items.length,
    validCount: dates.length
  };
}

export function getFieldSummary(items: GroupedItem[], field: DatabaseField): SummaryResult | null {
  if (field.type === 'number') {
    return calculateNumberSummary(items, field.id);
  } else if (field.type === 'date') {
    return calculateDateSummary(items, field.id);
  }
  return null;
}

export function formatSummaryValue(summary: SummaryResult, metric: string): string {
  if (summary.validCount === 0) {
    return '-';
  }

  if (summary.type === 'number') {
    switch (metric) {
      case 'sum':
        return summary.sum?.toLocaleString() || '-';
      case 'average':
        return summary.average?.toFixed(2) || '-';
      case 'min':
        return summary.min?.toString() || '-';
      case 'max':
        return summary.max?.toString() || '-';
      case 'count':
        return summary.validCount.toString();
      default:
        return '-';
    }
  } else if (summary.type === 'date') {
    switch (metric) {
      case 'earliest':
      case 'min':
        return summary.min ? format(summary.min as Date, 'MMM d, yyyy') : '-';
      case 'latest':
      case 'max':
        return summary.max ? format(summary.max as Date, 'MMM d, yyyy') : '-';
      case 'count':
        return summary.validCount.toString();
      default:
        return '-';
    }
  }

  return '-';
}

export function getAvailableMetrics(fieldType: string): string[] {
  if (fieldType === 'number') {
    return ['sum', 'average', 'min', 'max', 'count'];
  } else if (fieldType === 'date') {
    return ['earliest', 'latest', 'count'];
  }
  return [];
}
