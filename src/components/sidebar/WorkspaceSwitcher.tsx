
import React, { useState } from 'react';
import { ChevronDown, Plus, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher() {
  const { workspaces } = useWorkspaces();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const currentWorkspace = workspaces.find(w => w.id === workspaceId);

  const handleWorkspaceChange = (newWorkspaceId: string) => {
    navigate(`/workspace/${newWorkspaceId}`);
  };

  const handleCreateWorkspace = async () => {
    setIsCreating(true);
    // This would typically open a modal or navigate to a creation flow
    // For now, we'll just log it
    console.log('Create new workspace');
    setIsCreating(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between h-12 px-3 text-left font-normal",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Workspaces
        </div>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleWorkspaceChange(workspace.id)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              workspace.id === workspaceId && "bg-accent"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="truncate">{workspace.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCreateWorkspace}
          disabled={isCreating}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
