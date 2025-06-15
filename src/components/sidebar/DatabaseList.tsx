
import React from 'react';
import { Database as DatabaseIcon, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  return (
    <div className="space-y-1 mt-2 border-t pt-2">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="w-full text-sm font-medium flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted">
          <DatabaseIcon className="h-4 w-4" />
          <span className="flex-1 text-left truncate">Databases</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul role="group" className="pt-1" aria-label="Databases">
            <SidebarMenu>
              {databases.map((db) => (
                <DatabaseListItem
                  key={db.id}
                  database={db}
                  onDelete={onDeleteDatabase}
                />
              ))}
              {databases.length === 0 && !databasesLoading && (
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-xs text-muted-foreground">No databases.</div>
                </SidebarMenuItem>
              )}
              {databasesLoading && (
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin"/> Loading...
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
