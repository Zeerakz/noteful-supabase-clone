
import React, { useState, useEffect } from 'react';
import { DatabaseViewSelector, DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { useDatabaseView } from '@/hooks/useDatabaseView';

interface DatabaseViewProps {
  databaseId: string;
  workspaceId: string;
  className?: string;
}

export function DatabaseView({ databaseId, workspaceId, className }: DatabaseViewProps) {
  const { defaultView, saveDefaultView, loading } = useDatabaseView(databaseId);
  const [activeView, setActiveView] = useState<DatabaseViewType>(defaultView);

  // Update active view when default view loads
  useEffect(() => {
    setActiveView(defaultView);
  }, [defaultView]);

  const handleViewChange = (view: DatabaseViewType) => {
    setActiveView(view);
    // Save the preference when user changes view
    saveDefaultView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'table':
        return (
          <DatabaseTableView 
            databaseId={databaseId} 
            workspaceId={workspaceId}
          />
        );
      case 'list':
        return (
          <DatabaseListView
            databaseId={databaseId}
            workspaceId={workspaceId}
          />
        );
      case 'calendar':
        return (
          <DatabaseCalendarView
            databaseId={databaseId}
            workspaceId={workspaceId}
          />
        );
      case 'kanban':
        return (
          <DatabaseKanbanView
            databaseId={databaseId}
            workspaceId={workspaceId}
          />
        );
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
        <DatabaseViewSelector 
          activeView={activeView} 
          onViewChange={handleViewChange}
        />
        
        <div className="min-h-[400px]">
          {renderView()}
        </div>
      </div>
    </div>
  );
}
