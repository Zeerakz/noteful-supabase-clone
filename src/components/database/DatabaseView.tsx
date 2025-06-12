import React, { useState, useEffect } from 'react';
import { DatabaseViewSelector, DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { FilterModal, FilterRule } from './FilterModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDatabaseView } from '@/hooks/useDatabaseView';
import { useFilters } from '@/hooks/useFilters';
import { useDatabases } from '@/hooks/useDatabases';
import { DatabaseService } from '@/services/databaseService';
import { Filter } from 'lucide-react';

interface DatabaseViewProps {
  databaseId: string;
  workspaceId: string;
  className?: string;
}

export function DatabaseView({ databaseId, workspaceId, className }: DatabaseViewProps) {
  const { defaultView, saveDefaultView, loading } = useDatabaseView(databaseId);
  const { filters, setFilters, hasActiveFilters, clearFilters } = useFilters();
  const [activeView, setActiveView] = useState<DatabaseViewType>(defaultView);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fields, setFields] = useState([]);

  // Update active view when default view loads
  useEffect(() => {
    setActiveView(defaultView);
  }, [defaultView]);

  // Fetch database fields for filtering
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
            {hasActiveFilters && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <span className="modal-icon">
                  <Filter className="h-3 w-3 pointer-events-none shrink-0" />
                </span>
                <span>{filters.length} filter{filters.length !== 1 ? 's' : ''}</span>
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <span className="button-icon">
                <Filter className="h-4 w-4" />
              </span>
              <span className="text-sm">Filter</span>
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
    </div>
  );
}
