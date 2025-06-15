
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceListHeaderProps {
  onSignOut: () => void;
  onCreateWorkspace: (name: string, description: string) => Promise<void>;
}

export function WorkspaceListHeader({ onSignOut, onCreateWorkspace }: WorkspaceListHeaderProps) {
  const { user } = useAuth();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">Your Workspaces</h1>
        <p className="text-gray-600 mt-2">Manage your collaborative workspaces</p>
        {user && (
          <p className="text-sm text-gray-500 mt-1">Signed in as {user.email}</p>
        )}
      </div>

      <div className="flex space-x-2">
        <CreateWorkspaceDialog onConfirm={onCreateWorkspace} />
        <Button variant="outline" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
