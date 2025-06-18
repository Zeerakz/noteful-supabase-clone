
import React from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { WorkspaceGrid } from './WorkspaceGrid';
import { WorkspaceListHeader } from './WorkspaceListHeader';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

export function WorkspaceList() {
  const { workspaces, loading, error, fetchWorkspaces } = useWorkspaces();
  const { signOut } = useAuth();
  const { toast } = useToast();
  
  // Track session for analytics
  useSessionTracking();

  console.log('📋 WorkspaceList - State:', { 
    workspacesCount: workspaces?.length, 
    loading, 
    error: !!error 
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateWorkspace = async (name: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([
          {
            name,
            description,
            owner_user_id: (await supabase.auth.getUser()).data.user?.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workspace created successfully",
      });

      fetchWorkspaces();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to create workspace. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', workspaceId);

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Workspace deleted successfully",
      });

      fetchWorkspaces();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast({
        title: "Error",
        description: "Failed to delete workspace. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If loading, show loading state
  if (loading) {
    console.log('⏳ WorkspaceList showing loading state');
    return (
      <AppLayoutWithSidebar>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading workspaces...</div>
            </div>
          </div>
        </ScrollArea>
      </AppLayoutWithSidebar>
    );
  }

  // If error, show error state
  if (error) {
    console.error('❌ WorkspaceList error:', error);
    return (
      <AppLayoutWithSidebar>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <p className="text-destructive">Error loading workspaces</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </AppLayoutWithSidebar>
    );
  }

  // Auto-redirect if user has exactly one workspace
  if (workspaces && workspaces.length === 1) {
    const workspace = workspaces[0];
    console.log('🔄 Auto-redirecting to single workspace:', workspace.id);
    return <Navigate to={`/workspace/${workspace.id}`} replace />;
  }

  console.log('📋 Showing workspace grid with', workspaces?.length, 'workspaces');

  const breadcrumbs = [
    { label: 'Workspaces' }
  ];

  return (
    <AppLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          <WorkspaceListHeader 
            onSignOut={handleSignOut}
            onCreateWorkspace={handleCreateWorkspace}
          />
          <WorkspaceGrid 
            workspaces={workspaces || []} 
            onDeleteWorkspace={handleDeleteWorkspace}
          />
        </div>
      </ScrollArea>
    </AppLayoutWithSidebar>
  );
}
