
import React from 'react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkspaceSwitcherProps {
  onSelect?: () => void;
}

export function WorkspaceSwitcher({ onSelect }: WorkspaceSwitcherProps) {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaces();

  const handleWorkspaceSwitch = (workspaceId: string) => {
    switchWorkspace(workspaceId);
    onSelect?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between p-2 h-auto text-left sidebar-focus-ring"
          aria-label={`Current workspace: ${currentWorkspace?.name || 'Select workspace'}`}
        >
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-medium truncate w-full">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleWorkspaceSwitch(workspace.id)}
            className={workspace.id === currentWorkspace?.id ? 'bg-accent' : ''}
          >
            {workspace.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
