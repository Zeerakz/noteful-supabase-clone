
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const loadBreakingChanges = async () => {
      if (!databaseId) return;
      
      setLoadingBreakingChanges(true);
      try {
        // Use configurable time window
        const since = new Date();
        since.setDate(since.getDate() - 7); // Keep 7 days as base, but filter intelligently
        
        const { data, error } = await SchemaAuditService.getBreakingChangesSince(databaseId, since);
        
        if (error) {
          console.error('Failed to load breaking changes:', error);
          setBreakingChanges([]);
        } else {
          let filteredChanges = data || [];

          // Apply smart filtering based on configuration
          if (config.enableSmartFiltering) {
            // Auto-hide low severity changes if configured
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
    };

    loadBreakingChanges();
  }, [databaseId, config]);

  const handleDismissBreakingChange = (changeId: string, persistentDismissal: boolean = false) => {
    const newDismissedIds = new Set([...dismissedChangeIds, changeId]);
    setDismissedChangeIds(newDismissedIds);
    
    // Persist to localStorage
    if (databaseId) {
      const dismissalKey = persistentDismissal 
        ? `permanently_dismissed_breaking_changes_${databaseId}`
        : `dismissed_breaking_changes_${databaseId}`;
      
      localStorage.setItem(
        dismissalKey, 
        JSON.stringify(Array.from(newDismissedIds))
      );
    }
  };

  const handleAcknowledgeAllBreakingChanges = () => {
    const allChangeIds = breakingChanges.map(change => change.id);
    const newDismissedIds = new Set([...dismissedChangeIds, ...allChangeIds]);
    setDismissedChangeIds(newDismissedIds);
    
    // Persist to localStorage
    if (databaseId) {
      localStorage.setItem(
        `dismissed_breaking_changes_${databaseId}`, 
        JSON.stringify(Array.from(newDismissedIds))
      );
    }
  };

  const updateConfig = (newConfig: Partial<BreakingChangeConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    // Persist configuration
    if (databaseId) {
      localStorage.setItem(
        `breaking_changes_config_${databaseId}`,
        JSON.stringify(updatedConfig)
      );
    }
  };

  // Filter out dismissed changes and apply configuration
  const visibleBreakingChanges = breakingChanges.filter(change => 
    !dismissedChangeIds.has(change.id)
  );

  // Categorize changes by severity for better UX
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
    updateConfig
  };
}
