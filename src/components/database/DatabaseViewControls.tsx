
import React from 'react';
import { DatabaseViewSelector, DatabaseViewType } from './DatabaseViewSelector';
import { DatabasePrimaryToolbar } from './DatabasePrimaryToolbar';
import { DatabaseGroupingControls } from './DatabaseGroupingControls';
import { MultiLevelGroupingControls } from './grouping/MultiLevelGroupingControls';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Group } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from './SortingModal';
import { GroupingConfig } from '@/types/grouping';
import { PropertyType } from '@/types/property';

interface DatabaseViewControlsProps {
  fields: DatabaseField[];
  currentViewType: DatabaseViewType;
  onViewChange: (view: DatabaseViewType) => void;
  groupingFieldId?: string;
  onGroupingChange: (fieldId?: string) => void;
  filterGroup: FilterGroup;
  setFilterGroup: (group: FilterGroup) => void;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  hasActiveFilters: boolean;
  hasActiveSorts: boolean;
  clearFilters: () => void;
  clearSorts: () => void;
  showFilterModal: boolean;
  setShowFilterModal: (show: boolean) => void;
  showSortModal: boolean;
  setShowSortModal: (show: boolean) => void;
  groupingConfig?: GroupingConfig;
  onGroupingConfigChange?: (config: GroupingConfig) => void;
  databaseId: string;
  workspaceId: string;
  onAddRow?: () => void;
  onFieldsReorder: (fields: DatabaseField[]) => Promise<void>;
  onFieldUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onFieldDuplicate: (field: DatabaseField) => Promise<void>;
  onFieldDelete: (fieldId: string) => Promise<void>;
  onFieldCreate: (field: { name: string; type: PropertyType; settings?: any }) => Promise<void>;
}

export function DatabaseViewControls({
  fields,
  currentViewType,
  onViewChange,
  groupingFieldId,
  onGroupingChange,
  filterGroup,
  setFilterGroup,
  sortRules,
  setSortRules,
  hasActiveFilters,
  hasActiveSorts,
  clearFilters,
  clearSorts,
  showFilterModal,
  setShowFilterModal,
  showSortModal,
  setShowSortModal,
  groupingConfig,
  onGroupingConfigChange,
  databaseId,
  workspaceId,
  onAddRow,
  onFieldsReorder,
  onFieldUpdate,
  onFieldDuplicate,
  onFieldDelete,
  onFieldCreate
}: DatabaseViewControlsProps) {
  const hasMultiLevelGrouping = groupingConfig && groupingConfig.levels.length > 0;
  const hasSimpleGrouping = groupingFieldId && !hasMultiLevelGrouping;

  return (
    <div className="space-y-4">
      {/* View Type Selector */}
      <DatabaseViewSelector
        currentView={currentViewType}
        onViewChange={onViewChange}
      />

      {/* Primary Toolbar with Filters and Sorts */}
      <DatabasePrimaryToolbar
        databaseId={databaseId}
        workspaceId={workspaceId}
        fields={fields}
        filters={filterGroup}
        sorts={sortRules}
        onFiltersChange={setFilterGroup}
        onSortsChange={setSortRules}
        onAddRow={onAddRow}
        onFieldsReorder={onFieldsReorder}
        onFieldUpdate={onFieldUpdate}
        onFieldDuplicate={onFieldDuplicate}
        onFieldDelete={onFieldDelete}
        onFieldCreate={onFieldCreate}
      />

      {/* Grouping Controls */}
      <div className="flex items-center gap-2">
        {/* Simple Grouping (legacy) */}
        {!hasMultiLevelGrouping && (
          <DatabaseGroupingControls
            fields={fields}
            groupingFieldId={groupingFieldId}
            onGroupingChange={onGroupingChange}
          />
        )}

        {/* Multi-Level Grouping */}
        {onGroupingConfigChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={hasMultiLevelGrouping ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Group className="h-4 w-4" />
                {hasMultiLevelGrouping 
                  ? `${groupingConfig.levels.length} Level${groupingConfig.levels.length > 1 ? 's' : ''}`
                  : 'Multi-Level Group'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <MultiLevelGroupingControls
                fields={fields}
                groupingConfig={groupingConfig || { levels: [], maxLevels: 3 }}
                onGroupingConfigChange={onGroupingConfigChange}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Grouping Summary */}
      {(hasSimpleGrouping || hasMultiLevelGrouping) && (
        <div className="text-xs text-muted-foreground">
          {hasSimpleGrouping && (
            <span>Grouped by: {fields.find(f => f.id === groupingFieldId)?.name}</span>
          )}
          {hasMultiLevelGrouping && (
            <span>
              Multi-level grouping: {groupingConfig.levels.map((level, index) => {
                const field = fields.find(f => f.id === level.fieldId);
                return field?.name;
              }).filter(Boolean).join(' → ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
