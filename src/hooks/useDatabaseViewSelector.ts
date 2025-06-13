
import { useState } from 'react';

export interface GroupingConfig {
  fieldId?: string;
  showEmptyGroups?: boolean;
}

export function useDatabaseViewSelector() {
  const [currentView, setCurrentView] = useState<'table' | 'list' | 'timeline' | 'calendar' | 'kanban' | 'form' | 'gallery'>('table');
  const [groupingConfig, setGroupingConfig] = useState<GroupingConfig>({});
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => 
      prev.includes(groupKey) 
        ? prev.filter(key => key !== groupKey)
        : [...prev, groupKey]
    );
  };

  return {
    currentView,
    setCurrentView,
    groupingConfig,
    setGroupingConfig,
    collapsedGroups,
    toggleGroupCollapse
  };
}
