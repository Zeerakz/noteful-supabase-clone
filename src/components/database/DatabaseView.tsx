
import React, { useState, useEffect } from 'react';
import { DatabaseViewSelector, DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { FilterModal, FilterRule } from './FilterModal';
import { SortingModal, SortRule } from './SortingModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDatabaseView } from '@/hooks/useDatabaseView';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';
import { useDatabases } from '@/hooks/useDatabases';
import { DatabaseService } from '@/services/databaseService';
import { Filter, FilterX, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DatabaseViewProps {
  databaseId: string;
  workspaceId: string;
  className?: string;
}

export function DatabaseView({ databaseId, workspaceId, className }: DatabaseViewProps) {
  const { defaultView, saveDefaultView, loading } = useDatabaseView(databaseId);
  const { filters, setFilters, hasActiveFilters, clearFilters } = useFilters();
  const { sortRules, setSortRules, hasActiveSorts, clearSorts } = useSorting();
  const [activeView, setActiveView] = useState<DatabaseViewType>(defaultView);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortingModal, setShowSortingModal] = useState(false);
  const [fields, setFields] = useState([]);

  // Update active view when default view loads
  useEffect(() => {
    setActiveView(defaultView);
  }, [defaultView]);

  // Fetch database fields for filtering and sorting
  useEffect(() => {
    const fetchFields = async () => {
      if (!databaseId) return;
      
      try {
        const { data, error } = await DatabaseService.fetchDatabaseFields(databaseId);
        if (error) throw new Error(error);
        setFields(data || []);
      } catch (err) {
        console.error('Error fetching fields:', err);
      }
    };

    fetchFields();
  }, [databaseId]);

  const handleViewChange = (view: DatabaseViewType) => {
    setActiveView(view);
    // Save the preference when user changes view
    saveDefaultView(view);
  };

  const renderView = () => {
    const viewProps = {
      databaseId,
      workspaceId,
      filters,
      fields,
      sortRules,
    };

    switch (activeView) {
      case 'table':
        return <DatabaseTableView {...viewProps} />;
      case 'list':
        return <DatabaseListView {...viewProps} />;
      case 'calendar':
        return <DatabaseCalendarView {...viewProps} />;
      case 'kanban':
        return <DatabaseKanbanView {...viewProps} />;
      default:
        return null;
    }
  };

  const getSortIcon = (direction: 'asc' | 'desc') => {
    return direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const getFieldName = (fieldId: string) => {
    return fields.find((f: any) => f.id === fieldId)?.name || 'Unknown Field';
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded-lg animate-pulse" />
          <div className="min-h-[400px] bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <DatabaseViewSelector 
            activeView={activeView} 
            onViewChange={handleViewChange}
          />
          
          <div className="flex items-center gap-2">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <span className="inline-flex">
                    <Filter className="h-3 w-3" />
                  </span>
                  {filters.length} filter{filters.length !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2"
                >
                  <span className="inline-flex">
                    <FilterX className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            )}

            {/* Active Sorts */}
            {hasActiveSorts && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <span className="inline-flex">
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                  {sortRules.length} sort{sortRules.length !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSorts}
                  className="h-8 px-2"
                >
                  <span className="inline-flex">
                    <FilterX className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterModal(true)}
              className="gap-2"
            >
              <span className="inline-flex">
                <Filter className="h-4 w-4" />
              </span>
              Filter
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSortingModal(true)}
              className="gap-2"
            >
              <span className="inline-flex">
                <ArrowUpDown className="h-4 w-4" />
              </span>
              Sort
            </Button>
          </div>
        </div>
        
        <div className="min-h-[400px]">
          {renderView()}
        </div>
      </div>

      <FilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        fields={fields}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <SortingModal
        open={showSortingModal}
        onOpenChange={setShowSortingModal}
        fields={fields}
        sortRules={sortRules}
        onSortRulesChange={setSortRules}
      />
    </div>
  );
}
