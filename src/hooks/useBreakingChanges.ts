
import { useState, useEffect, useCallback } from 'react';
import { BreakingChange } from '@/types/schemaAudit';
import { SchemaAuditService } from '@/services/schemaAuditService';

interface BreakingChangeConfig {
  enableSmartFiltering: boolean;
  autoHideLowSeverity: boolean;
  gracePeriodHours: number;
}

export function useBreakingChanges(databaseId: string | undefined) {
  const [breakingChanges, setBreakingChanges] = useState<BreakingChange[]>([]);
  const [loadingBreakingChanges, setLoadingBreakingChanges] = useState(true);
  const [dismissedChangeIds, setDismissedChangeIds] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<BreakingChangeConfig>({
    enableSmartFiltering: true,
    autoHideLowSeverity: false,
    gracePeriodHours: 24
  });

  // Load configuration and dismissed changes from localStorage
  useEffect(() => {
    if (databaseId) {
      // Load dismissed changes
      const savedDismissals = localStorage.getItem(`dismissed_breaking_changes_${databaseId}`);
      if (savedDismissals) {
        try {
          const parsedDismissals = JSON.parse(savedDismissals);
          setDismissedChangeIds(new Set(parsedDismissals));
        } catch (error) {
          console.error('Failed to parse dismissed breaking changes:', error);
        }
      }

      // Load configuration
      const savedConfig = localStorage.getItem(`breaking_changes_config_${databaseId}`);
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(prev => ({ ...prev, ...parsedConfig }));
        } catch (error) {
          console.error('Failed to parse breaking changes config:', error);
        }
      }
    }
  }, [databaseId]);

  const loadBreakingChanges = useCallback(async () => {
    if (!databaseId) return;
    
    setLoadingBreakingChanges(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      
      const { data, error } = await SchemaAuditService.getBreakingChangesSince(databaseId, since);
      
      if (error) {
        console.error('Failed to load breaking changes:', error);
        setBreakingChanges([]);
      } else {
        let filteredChanges = data || [];

        // Apply smart filtering based on configuration
        if (config.enableSmartFiltering) {
          if (config.autoHideLowSeverity) {
            filteredChanges = filteredChanges.filter(change => change.severity !== 'low');
          }
        }

        setBreakingChanges(filteredChanges);
      }
    } catch (err) {
      console.error('Error loading breaking changes:', err);
      setBreakingChanges([]);
    } finally {
      setLoadingBreakingChanges(false);
    }
  }, [databaseId, config]);

  useEffect(() => {
    loadBreakingChanges();
  }, [loadBreakingChanges]);

  const handleDismissBreakingChange = useCallback((changeId: string, persistentDismissal: boolean = false) => {
    // Optimistic update - immediately update UI
    setDismissedChangeIds(prev => {
      const newSet = new Set(prev);
      newSet.add(changeId);
      return newSet;
    });
    
    // Persist to localStorage in background
    if (databaseId) {
      const dismissalKey = persistentDismissal 
        ? `permanently_dismissed_breaking_changes_${databaseId}`
        : `dismissed_breaking_changes_${databaseId}`;
      
      // Update localStorage optimistically
      const currentDismissed = Array.from(dismissedChangeIds);
      currentDismissed.push(changeId);
      
      try {
        localStorage.setItem(dismissalKey, JSON.stringify(currentDismissed));
      } catch (error) {
        console.error('Failed to persist dismissal:', error);
        // Revert optimistic update on storage failure
        setDismissedChangeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(changeId);
          return newSet;
        });
      }
    }
  }, [databaseId, dismissedChangeIds]);

  const handleAcknowledgeAllBreakingChanges = useCallback(() => {
    const allChangeIds = breakingChanges.map(change => change.id);
    
    // Optimistic update - immediately update UI
    setDismissedChangeIds(prev => {
      const newSet = new Set(prev);
      allChangeIds.forEach(id => newSet.add(id));
      return newSet;
    });
    
    // Persist to localStorage in background
    if (databaseId) {
      try {
        const allDismissed = Array.from(new Set([...dismissedChangeIds, ...allChangeIds]));
        localStorage.setItem(
          `dismissed_breaking_changes_${databaseId}`, 
          JSON.stringify(allDismissed)
        );
      } catch (error) {
        console.error('Failed to persist acknowledge all:', error);
        // Revert optimistic update on storage failure
        setDismissedChangeIds(prev => {
          const newSet = new Set(prev);
          allChangeIds.forEach(id => newSet.delete(id));
          return newSet;
        });
      }
    }
  }, [databaseId, breakingChanges, dismissedChangeIds]);

  const updateConfig = useCallback((newConfig: Partial<BreakingChangeConfig>) => {
    // Optimistic update - immediately update UI
    setConfig(prev => {
      const updatedConfig = { ...prev, ...newConfig };
      
      // Persist configuration in background
      if (databaseId) {
        try {
          localStorage.setItem(
            `breaking_changes_config_${databaseId}`,
            JSON.stringify(updatedConfig)
          );
        } catch (error) {
          console.error('Failed to persist config:', error);
        }
      }
      
      return updatedConfig;
    });
    
    // Immediately reload breaking changes with new config
    loadBreakingChanges();
  }, [databaseId, loadBreakingChanges]);

  // Filter out dismissed changes and apply configuration - computed optimistically
  const visibleBreakingChanges = breakingChanges.filter(change => 
    !dismissedChangeIds.has(change.id)
  );

  // Categorize changes by severity for better UX - computed optimistically
  const categorizedChanges = {
    high: visibleBreakingChanges.filter(c => c.severity === 'high'),
    medium: visibleBreakingChanges.filter(c => c.severity === 'medium'),
    low: visibleBreakingChanges.filter(c => c.severity === 'low')
  };

  return {
    breakingChanges,
    loadingBreakingChanges,
    visibleBreakingChanges,
    categorizedChanges,
    config,
    handleDismissBreakingChange,
    handleAcknowledgeAllBreakingChanges,
    updateConfig,
    refreshBreakingChanges: loadBreakingChanges
  };
}
