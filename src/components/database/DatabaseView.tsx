
import React, { useState } from 'react';
import { DatabaseViewSelector, DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseCalendarView } from './DatabaseCalendarView';

interface DatabaseViewProps {
  databaseId: string;
  workspaceId: string;
  className?: string;
}

export function DatabaseView({ databaseId, workspaceId, className }: DatabaseViewProps) {
  const [activeView, setActiveView] = useState<DatabaseViewType>('table');

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
          <div className="text-center py-8 text-muted-foreground">
            Kanban view coming soon...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <DatabaseViewSelector 
          activeView={activeView} 
          onViewChange={setActiveView}
        />
        
        <div className="min-h-[400px]">
          {renderView()}
        </div>
      </div>
    </div>
  );
}
