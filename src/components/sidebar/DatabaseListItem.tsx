
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Database as DatabaseIcon, MoreHorizontal, Settings, Trash2 } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Database } from '@/types/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface DatabaseListItemProps {
  database: Database;
  onDelete: (databaseId: string, databaseName: string) => void;
}

export function DatabaseListItem({ database, onDelete }: DatabaseListItemProps) {
  const { workspaceId, databaseId } = useParams<{ workspaceId: string, databaseId: string }>();
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/db/${database.id}`);
    }
  };

  const isActive = database.id === databaseId;

  return (
    <SidebarMenuItem>
      <div className="group flex items-center pr-2">
        <SidebarMenuButton onClick={handleNavigate} className="gap-2 flex-1" isActive={isActive}>
          <DatabaseIcon className="h-4 w-4" />
          <span className="truncate">{database.name}</span>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleNavigate}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => onDelete(database.id, database.name)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SidebarMenuItem>
  );
}
