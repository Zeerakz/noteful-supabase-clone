
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WorkspaceListHeader } from './WorkspaceListHeader';
import { WorkspaceGrid } from './WorkspaceGrid';
import { WorkspaceEmptyState } from './WorkspaceEmptyState';
import { TrashedWorkspacesList } from './TrashedWorkspacesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function WorkspaceList() {
  const { 
    workspaces, 
    trashedWorkspaces, 
    loading, 
    error, 
    createWorkspace, 
    deleteWorkspace,
    restoreWorkspace,
    permanentlyDeleteWorkspace
  } = useWorkspaces();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects and only redirect once when conditions are met
    if (!loading && !error && workspaces.length === 1 && trashedWorkspaces.length === 0 && !hasRedirected.current) {
      hasRedirected.current = true;
      console.log('🔄 Auto-redirecting to single workspace:', workspaces[0].id);
      
      // Use setTimeout to avoid immediate redirect issues
      const timeoutId = setTimeout(() => {
        navigate(`/workspace/${workspaces[0].id}`, { replace: true });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [workspaces, trashedWorkspaces, loading, error, navigate]);

  // Reset redirect flag when workspaces change significantly
  useEffect(() => {
    if (workspaces.length !== 1 || trashedWorkspaces.length > 0) {
      hasRedirected.current = false;
    }
  }, [workspaces.length, trashedWorkspaces.length]);

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
    if (!confirm(`Are you sure you want to move "${workspaceName}" to trash? You can restore it later if needed.`)) {
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
        description: "Workspace moved to trash successfully!",
      });
    }
  };

  const handleRestoreWorkspace = async (workspaceId: string, workspaceName: string) => {
    const { error: restoreError } = await restoreWorkspace(workspaceId);
    
    if (restoreError) {
      toast({
        title: "Error",
        description: restoreError,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `"${workspaceName}" restored successfully!`,
      });
    }
  };

  const handlePermanentlyDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${workspaceName}"? This action cannot be undone and will delete all data in this workspace.`)) {
      return;
    }

    const { error: deleteError } = await permanentlyDeleteWorkspace(workspaceId);
    
    if (deleteError) {
      toast({
        title: "Error",
        description: deleteError,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Workspace permanently deleted!",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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

  // Show redirecting message only if we have one workspace and are about to redirect
  if (workspaces.length === 1 && trashedWorkspaces.length === 0 && !loading && !error && hasRedirected.current) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to your workspace...</div>
      </div>
    );
  }

  const hasAnyWorkspaces = workspaces.length > 0 || trashedWorkspaces.length > 0;

  return (
    <div className="container mx-auto p-6">
      <WorkspaceListHeader
        onSignOut={handleSignOut}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {hasAnyWorkspaces ? (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Workspaces ({workspaces.length})
            </TabsTrigger>
            <TabsTrigger value="trash">
              Trash ({trashedWorkspaces.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            {workspaces.length > 0 ? (
              <WorkspaceGrid
                workspaces={workspaces}
                onDeleteWorkspace={handleDeleteWorkspace}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active workspaces</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trash" className="mt-6">
            <TrashedWorkspacesList
              trashedWorkspaces={trashedWorkspaces}
              onRestoreWorkspace={handleRestoreWorkspace}
              onPermanentlyDeleteWorkspace={handlePermanentlyDeleteWorkspace}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <WorkspaceEmptyState onCreateWorkspace={handleCreateWorkspace} />
      )}
    </div>
  );
}
