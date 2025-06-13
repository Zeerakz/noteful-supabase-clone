
import { useState, useCallback } from 'react';

export type SummaryMetric = 'sum' | 'average' | 'min' | 'max' | 'count' | 'earliest' | 'latest';

export interface SummaryPreferences {
  enabled: boolean;
  defaultMetrics: {
    number: SummaryMetric[];
    date: SummaryMetric[];
  };
  fieldPreferences: Record<string, SummaryMetric[]>; // field ID -> preferred metrics
}

const DEFAULT_PREFERENCES: SummaryPreferences = {
  enabled: true,
  defaultMetrics: {
    number: ['sum', 'average'],
    date: ['earliest', 'latest']
  },
  fieldPreferences: {}
};

export function useSummaryPreferences(databaseId?: string) {
  const [preferences, setPreferences] = useState<SummaryPreferences>(DEFAULT_PREFERENCES);

  const updatePreferences = useCallback((updates: Partial<SummaryPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const setFieldMetrics = useCallback((fieldId: string, metrics: SummaryMetric[]) => {
    setPreferences(prev => ({
      ...prev,
      fieldPreferences: {
        ...prev.fieldPreferences,
        [fieldId]: metrics
      }
    }));
  }, []);

  const getFieldMetrics = useCallback((fieldId: string, fieldType: 'number' | 'date'): SummaryMetric[] => {
    return preferences.fieldPreferences[fieldId] || preferences.defaultMetrics[fieldType];
  }, [preferences]);

  const toggleSummaries = useCallback(() => {
    setPreferences(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return {
    preferences,
    updatePreferences,
    setFieldMetrics,
    getFieldMetrics,
    toggleSummaries
  };
}
