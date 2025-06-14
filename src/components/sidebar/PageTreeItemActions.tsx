
import React from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PageTreeItemActionsProps {
  onDelete: () => void;
}

export function PageTreeItemActions({ onDelete }: PageTreeItemActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction 
          className="data-[state=open]:bg-sidebar-accent"
          data-testid="more-options"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Page options</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
          data-testid="delete-option"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
