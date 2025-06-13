
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Filter, 
  SortAsc, 
  Settings,
  Table,
  List,
  Calendar,
  Kanban,
  Clock,
  Images,
  FileText
} from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from './SortingModal';
import { PropertyType } from '@/types/property';
import { PermissionGate } from './PermissionGate';

export type DatabaseViewType = 'table' | 'list' | 'calendar' | 'kanban' | 'timeline' | 'form' | 'gallery';

interface DatabaseUnifiedToolbarProps {
  // View Controls
  currentViewType: DatabaseViewType;
  onViewChange: (view: DatabaseViewType) => void;
  
  // Filter & Sort
  fields: DatabaseField[];
  filters: FilterGroup;
  sorts: SortRule[];
  onFiltersChange: (filters: FilterGroup) => void;
  onSortsChange: (sorts: SortRule[]) => void;
  
  // Actions
  databaseId: string;
  workspaceId: string;
  onAddRow?: () => void;
  onFieldsReorder: (fields: DatabaseField[]) => Promise<void>;
  onFieldUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onFieldDuplicate: (field: DatabaseField) => Promise<void>;
  onFieldDelete: (fieldId: string) => Promise<void>;
  onFieldCreate: (field: { name: string; type: PropertyType; settings?: any }) => Promise<void>;
  
  // Modal controls
  onShowPropertiesModal: () => void;
  onShowFilterModal: () => void;
  onShowSortModal: () => void;
}

export function DatabaseUnifiedToolbar({
  currentViewType,
  onViewChange,
  fields,
  filters,
  sorts,
  onFiltersChange,
  onSortsChange,
  databaseId,
  workspaceId,
  onAddRow,
  onShowPropertiesModal,
  onShowFilterModal,
  onShowSortModal
}: DatabaseUnifiedToolbarProps) {
  const views = [
    { type: 'table' as const, label: 'Table', icon: Table },
    { type: 'list' as const, label: 'List', icon: List },
    { type: 'timeline' as const, label: 'Timeline', icon: Clock },
    { type: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { type: 'kanban' as const, label: 'Board', icon: Kanban },
    { type: 'gallery' as const, label: 'Gallery', icon: Images },
    { type: 'form' as const, label: 'Form', icon: FileText },
  ];

  // Count active filters and sorts
  const activeFiltersCount = filters?.rules?.length || 0;
  const activeSortsCount = sorts?.length || 0;

  return (
    <div className="bg-background border-b border-border/20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Left side: View Switcher */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
            {views.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant={currentViewType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange(type)}
                className="h-8 px-3 gap-2 text-sm font-medium transition-all duration-200"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-3">
            {/* Add Row */}
            <PermissionGate
              workspaceId={workspaceId}
              requiredPermission="canAddRows"
              tooltipMessage="You need permission to add new rows"
            >
              <Button
                onClick={onAddRow}
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </PermissionGate>

            <Separator orientation="vertical" className="h-6" />

            {/* Filter */}
            <Button
              onClick={onShowFilterModal}
              size="sm"
              variant={activeFiltersCount > 0 ? "secondary" : "ghost"}
              className="gap-2 relative"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Sort */}
            <Button
              onClick={onShowSortModal}
              size="sm"
              variant={activeSortsCount > 0 ? "secondary" : "ghost"}
              className="gap-2 relative"
            >
              <SortAsc className="h-4 w-4" />
              <span className="hidden sm:inline">Sort</span>
              {activeSortsCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {activeSortsCount}
                </Badge>
              )}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Properties */}
            <PermissionGate
              workspaceId={workspaceId}
              requiredPermission="canModifySchema"
              tooltipMessage="You need 'Full access' permission to manage properties"
            >
              <Button
                onClick={onShowPropertiesModal}
                size="sm"
                variant="ghost"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Properties</span>
              </Button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>
  );
}
