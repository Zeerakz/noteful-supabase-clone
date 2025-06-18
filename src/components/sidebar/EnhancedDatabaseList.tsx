
import React from 'react';
import { Loader2, Database } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarGroupLabel } from '@/components/ui/sidebar';
import { DraggableDatabaseItem } from './DraggableDatabaseItem';
import { DroppableSection } from './DroppableSection';
import { Database as DatabaseType } from '@/types/database';

interface EnhancedDatabaseListProps {
  databases: DatabaseType[];
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
      <div className="px-2 py-1">
        <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70 mb-1">
          <Database className="h-4 w-4" />
          Databases
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin"/> Loading databases...
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    );
  }
  
  if (databases.length === 0) {
    return (
      <div className="px-2 py-1">
        <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70 mb-1">
          <Database className="h-4 w-4" />
          Databases
        </SidebarGroupLabel>
        <DroppableSection 
          droppableId="databases-empty" 
          placeholder="Drop databases here"
          dragType="database"
          className="min-h-[40px] rounded-md border-2 border-dashed border-border/50 flex items-center justify-center"
        >
          <div className="text-xs text-muted-foreground py-2">No databases yet</div>
        </DroppableSection>
      </div>
    );
  }

  return (
    <div className="px-2 py-1">
      <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70 mb-1">
        <Database className="h-4 w-4" />
        Databases
      </SidebarGroupLabel>
      <DroppableSection 
        droppableId="databases" 
        placeholder="Drop items here"
        dragType="database"
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
    </div>
  );
}
