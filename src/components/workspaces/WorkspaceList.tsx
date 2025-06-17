
import React from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkspaceGrid } from './WorkspaceGrid';
import { WorkspaceListHeader } from './WorkspaceListHeader';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useSessionTracking } from '@/hooks/useSessionTracking';

export function WorkspaceList() {
  const { workspaces, loading, error } = useWorkspaces();
  
  // Track session for analytics
  useSessionTracking();

  console.log('📋 WorkspaceList - State:', { 
    workspacesCount: workspaces?.length, 
    loading, 
    error: !!error 
  });

  // If loading, show loading state
  if (loading) {
    console.log('⏳ WorkspaceList showing loading state');
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading workspaces...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // If error, show error state
  if (error) {
    console.error('❌ WorkspaceList error:', error);
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <p className="text-destructive">Error loading workspaces</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Auto-redirect if user has exactly one workspace
  if (workspaces && workspaces.length === 1) {
    const workspace = workspaces[0];
    console.log('🔄 Auto-redirecting to single workspace:', workspace.id);
    return <Navigate to={`/workspace/${workspace.id}`} replace />;
  }

  console.log('📋 Showing workspace grid with', workspaces?.length, 'workspaces');

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8">
        <WorkspaceListHeader />
        <WorkspaceGrid workspaces={workspaces || []} />
      </div>
    </AppLayout>
  );
}
