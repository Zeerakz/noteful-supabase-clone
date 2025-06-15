
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WorkspaceListHeader } from './WorkspaceListHeader';
import { WorkspaceGrid } from './WorkspaceGrid';
import { WorkspaceEmptyState } from './WorkspaceEmptyState';

export function WorkspaceList() {
  const { workspaces, loading, error, createWorkspace, deleteWorkspace } = useWorkspaces();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !error && workspaces.length === 1) {
      navigate(`/workspace/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaces, loading, error, navigate]);

  const handleCreateWorkspace = async (name: string, description: string) => {
    const { error: createError } = await createWorkspace(name, description);
    
    if (createError) {
      toast({
        title: "Error",
        description: createError,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Workspace created successfully!",
      });
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`)) {
      return;
    }

    const { error: deleteError } = await deleteWorkspace(workspaceId);
    
    if (deleteError) {
      toast({
        title: "Error",
        description: deleteError,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Workspace deleted successfully!",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading workspaces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-lg text-red-600">Error loading workspaces</div>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
  }

  // If there's only one workspace, show a redirecting message while the effect runs.
  if (workspaces.length === 1 && !loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to your workspace...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <WorkspaceListHeader
        onSignOut={handleSignOut}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {workspaces.length > 0 ? (
        <WorkspaceGrid
          workspaces={workspaces}
          onDeleteWorkspace={handleDeleteWorkspace}
        />
      ) : (
        <WorkspaceEmptyState onCreateWorkspace={handleCreateWorkspace} />
      )}
    </div>
  );
}
