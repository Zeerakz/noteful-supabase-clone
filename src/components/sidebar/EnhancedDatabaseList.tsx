
import React from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { DraggableDatabaseItem } from './DraggableDatabaseItem';
import { DroppableSection } from './DroppableSection';
import { Database } from '@/types/database';

interface EnhancedDatabaseListProps {
  databases: Database[];
  databasesLoading: boolean;
  onDeleteDatabase: (databaseId: string, databaseName: string) => void;
}

export function EnhancedDatabaseList({
  databases,
  databasesLoading,
  onDeleteDatabase,
}: EnhancedDatabaseListProps) {
  if (databasesLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin"/> Loading databases...
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
  
  if (databases.length === 0) {
    return (
      <DroppableSection 
        droppableId="databases-empty" 
        placeholder="Drop databases here"
        className="min-h-[40px]"
      >
        <div />
      </DroppableSection>
    );
  }

  return (
    <DroppableSection 
      droppableId="databases" 
      placeholder="Drop items here"
    >
      <SidebarMenu>
        {databases.map((db, index) => (
          <SidebarMenuItem key={db.id}>
            <DraggableDatabaseItem
              database={db}
              index={index}
              onDelete={onDeleteDatabase}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </DroppableSection>
  );
}
