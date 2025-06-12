
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, List, Calendar, Kanban, FileText } from 'lucide-react';

export type DatabaseViewType = 'table' | 'list' | 'calendar' | 'kanban' | 'form';

interface DatabaseViewSelectorProps {
  currentView: DatabaseViewType;
  onViewChange: (view: DatabaseViewType) => void;
}

export function DatabaseViewSelector({ currentView, onViewChange }: DatabaseViewSelectorProps) {
  const views = [
    { type: 'table' as const, label: 'Table', icon: Table },
    { type: 'list' as const, label: 'List', icon: List },
    { type: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { type: 'kanban' as const, label: 'Kanban', icon: Kanban },
    { type: 'form' as const, label: 'Form', icon: FileText },
  ];

  return (
    <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
      {views.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant={currentView === type ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange(type)}
          className="h-8 gap-2"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
