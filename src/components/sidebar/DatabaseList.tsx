
import React from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { DatabaseListItem } from './DatabaseListItem';
import { Database } from '@/types/database';

interface DatabaseListProps {
  databases: Database[];
  databasesLoading: boolean;
  onDeleteDatabase: (databaseId: string, databaseName: string) => void;
}

export function DatabaseList({
  databases,
  databasesLoading,
  onDeleteDatabase,
}: DatabaseListProps) {
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
    return null;
  }

  return (
    <SidebarMenu>
      {databases.map((db) => (
        <DatabaseListItem
          key={db.id}
          database={db}
          onDelete={onDeleteDatabase}
        />
      ))}
    </SidebarMenu>
  );
}
