
import React from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';

interface WorkspaceEmptyStateProps {
  onCreateWorkspace: (name: string, description: string) => Promise<void>;
}

export function WorkspaceEmptyState({ onCreateWorkspace }: WorkspaceEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <Users className="h-16 w-16 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
      <p className="text-gray-500 mb-6">
        Create your first workspace to start collaborating with your team.
      </p>
      <CreateWorkspaceDialog
        onConfirm={onCreateWorkspace}
        triggerButton={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Workspace
          </Button>
        }
      />
    </div>
  );
}
