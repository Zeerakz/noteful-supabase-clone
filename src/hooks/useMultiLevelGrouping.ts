
import { useState, useCallback } from 'react';
import { GroupingConfig } from '@/types/grouping';

interface UseMultiLevelGroupingProps {
  maxLevels?: number;
  onGroupingChange?: (config: GroupingConfig) => void;
}

export function useMultiLevelGrouping({ 
  maxLevels = 3,
  onGroupingChange 
}: UseMultiLevelGroupingProps = {}) {
  const [groupingConfig, setGroupingConfig] = useState<GroupingConfig>({
    levels: [],
    maxLevels
  });

  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const updateGroupingConfig = useCallback((config: GroupingConfig) => {
    setGroupingConfig(config);
    onGroupingChange?.(config);
  }, [onGroupingChange]);

  const toggleGroupCollapse = useCallback((groupKey: string) => {
    setCollapsedGroups(prev => {
      const isCollapsed = prev.includes(groupKey);
      return isCollapsed
        ? prev.filter(key => key !== groupKey)
        : [...prev, groupKey];
    });
  }, []);

  const clearGrouping = useCallback(() => {
    const emptyConfig: GroupingConfig = {
      levels: [],
      maxLevels
    };
    updateGroupingConfig(emptyConfig);
    setCollapsedGroups([]);
  }, [maxLevels, updateGroupingConfig]);

  const hasGrouping = groupingConfig.levels.length > 0;

  return {
    groupingConfig,
    collapsedGroups,
    hasGrouping,
    updateGroupingConfig,
    toggleGroupCollapse,
    clearGrouping
  };
}
