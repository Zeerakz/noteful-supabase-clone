
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Filter, SortAsc, Eye, Grid3x3 } from 'lucide-react';
import { ManagePropertiesModal } from './fields/ManagePropertiesModal';
import { FilterModal } from './FilterModal';
import { SortingModal } from './SortingModal';
import { DatabaseField } from '@/types/database';
import { PropertyType } from '@/types/property';
import { FilterGroup } from '@/types/filters';
import { SortRule } from './SortingModal';
import { PermissionGate } from './PermissionGate';

interface DatabasePrimaryToolbarProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filters: FilterGroup;
  sorts: SortRule[];
  onFiltersChange: (filters: FilterGroup) => void;
  onSortsChange: (sorts: SortRule[]) => void;
  onAddRow?: () => void;
  onFieldsReorder: (fields: DatabaseField[]) => Promise<void>;
  onFieldUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onFieldDuplicate: (field: DatabaseField) => Promise<void>;
  onFieldDelete: (fieldId: string) => Promise<void>;
  onFieldCreate: (field: { name: string; type: PropertyType; settings?: any }) => Promise<void>;
}

export function DatabasePrimaryToolbar({
  databaseId,
  workspaceId,
  fields,
  filters,
  sorts,
  onFiltersChange,
  onSortsChange,
  onAddRow,
  onFieldsReorder,
  onFieldUpdate,
  onFieldDuplicate,
  onFieldDelete,
  onFieldCreate
}: DatabasePrimaryToolbarProps) {
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Count active filters and sorts - FilterGroup has rules array, not conditions
  const activeFiltersCount = filters.rules?.length || 0;
  const activeSortsCount = sorts.length;

  return (
    <>
      <div className="flex items-center gap-2 p-3 border-b border-border/20 bg-background">
        {/* Add Row Button */}
        <PermissionGate
          workspaceId={workspaceId}
          requiredPermission="canAddRows"
          tooltipMessage="You need permission to add new rows"
        >
          <Button
            onClick={onAddRow}
            size="sm"
            variant="default"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </PermissionGate>

        <div className="h-4 w-px bg-border/20 mx-1" />

        {/* View Controls */}
        <Button
          onClick={() => setShowFilterModal(true)}
          size="sm"
          variant={activeFiltersCount > 0 ? "secondary" : "ghost"}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        <Button
          onClick={() => setShowSortModal(true)}
          size="sm"
          variant={activeSortsCount > 0 ? "secondary" : "ghost"}
          className="gap-2"
        >
          <SortAsc className="h-4 w-4" />
          Sort
          {activeSortsCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
              {activeSortsCount}
            </span>
          )}
        </Button>

        <div className="h-4 w-px bg-border/20 mx-1" />

        {/* Properties Management */}
        <PermissionGate
          workspaceId={workspaceId}
          requiredPermission="canModifySchema"
          tooltipMessage="You need 'Full access' permission to manage properties"
        >
          <Button
            onClick={() => setShowPropertiesModal(true)}
            size="sm"
            variant="ghost"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Properties
          </Button>
        </PermissionGate>
      </div>

      {/* Modals */}
      <ManagePropertiesModal
        open={showPropertiesModal}
        onOpenChange={setShowPropertiesModal}
        fields={fields}
        workspaceId={workspaceId}
        onFieldsReorder={onFieldsReorder}
        onFieldUpdate={onFieldUpdate}
        onFieldDuplicate={onFieldDuplicate}
        onFieldDelete={onFieldDelete}
        onFieldCreate={onFieldCreate}
      />

      <FilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        fields={fields}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <SortingModal
        open={showSortModal}
        onOpenChange={setShowSortModal}
        fields={fields}
        sortRules={sorts}
        onSortRulesChange={onSortsChange}
      />
    </>
  );
}
