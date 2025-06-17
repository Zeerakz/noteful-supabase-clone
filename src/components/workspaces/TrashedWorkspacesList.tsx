
import React from 'react';
import { Trash2, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workspace } from '@/hooks/useWorkspaces';

interface TrashedWorkspacesListProps {
  trashedWorkspaces: Workspace[];
  onRestoreWorkspace: (workspaceId: string, workspaceName: string) => void;
  onPermanentlyDeleteWorkspace: (workspaceId: string, workspaceName: string) => void;
}

export function TrashedWorkspacesList({ 
  trashedWorkspaces, 
  onRestoreWorkspace, 
  onPermanentlyDeleteWorkspace 
}: TrashedWorkspacesListProps) {
  const getDaysInTrash = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deleted.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilPermanentDeletion = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const permanentDeletionDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const now = new Date();
    const diffTime = permanentDeletionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (trashedWorkspaces.length === 0) {
    return (
      <div className="text-center py-12">
        <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No workspaces in trash</h3>
        <p className="text-muted-foreground">
          Deleted workspaces will appear here and can be restored within 30 days.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-800">
          <Clock className="h-4 w-4" />
          <p className="text-sm font-medium">
            Workspaces in trash will be permanently deleted after 30 days
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trashedWorkspaces.map((workspace) => {
          const daysInTrash = getDaysInTrash(workspace.deleted_at!);
          const daysUntilDeletion = getDaysUntilPermanentDeletion(workspace.deleted_at!);
          
          return (
            <Card key={workspace.id} className="border-destructive/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base text-muted-foreground">
                      {workspace.name}
                    </CardTitle>
                    {workspace.description && (
                      <CardDescription className="mt-1">
                        {workspace.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    <p>Deleted {daysInTrash} day{daysInTrash !== 1 ? 's' : ''} ago</p>
                    {daysUntilDeletion > 0 ? (
                      <p className="text-amber-600">
                        Permanent deletion in {daysUntilDeletion} day{daysUntilDeletion !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="text-destructive font-medium">
                        Eligible for permanent deletion
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestoreWorkspace(workspace.id, workspace.name)}
                      className="flex-1"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onPermanentlyDeleteWorkspace(workspace.id, workspace.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
