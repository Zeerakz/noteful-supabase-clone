
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, List, Calendar, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DatabaseViewType = 'table' | 'list' | 'calendar' | 'kanban';

interface DatabaseViewSelectorProps {
  activeView: DatabaseViewType;
  onViewChange: (view: DatabaseViewType) => void;
  className?: string;
}

const viewOptions = [
  {
    type: 'table' as const,
    label: 'Table',
    icon: Table,
  },
  {
    type: 'list' as const,
    label: 'List',
    icon: List,
  },
  {
    type: 'calendar' as const,
    label: 'Calendar',
    icon: Calendar,
  },
  {
    type: 'kanban' as const,
    label: 'Kanban',
    icon: Kanban,
  },
];

export function DatabaseViewSelector({ 
  activeView, 
  onViewChange, 
  className 
}: DatabaseViewSelectorProps) {
  return (
    <div className={cn("flex gap-1 p-1 bg-muted rounded-lg", className)}>
      {viewOptions.map((option) => {
        const Icon = option.icon;
        const isActive = activeView === option.type;
        
        return (
          <Button
            key={option.type}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange(option.type)}
            className={cn(
              "gap-2 min-w-[80px]",
              isActive && "bg-background shadow-sm"
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
