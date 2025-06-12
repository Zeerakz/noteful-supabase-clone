
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useDatabases } from '@/hooks/useDatabases';
import { DatabaseView } from '@/components/database/DatabaseView';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';

export function DatabasePage() {
  const { workspaceId, databaseId } = useParams<{ workspaceId: string; databaseId: string }>();
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const { databases, loading: databasesLoading } = useDatabases(workspaceId);

  if (workspacesLoading || databasesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const workspace = workspaces.find(w => w.id === workspaceId);
  const database = databases.find(d => d.id === databaseId);

  if (!workspace || !database) {
    return <Navigate to="/" replace />;
  }

  const breadcrumbs = [
    { label: workspace.name, href: `/workspace/${workspaceId}` },
    { label: database.name }
  ];

  return (
    <AppLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <div className="h-full flex flex-col space-y-6">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold">{database.name}</h1>
            {database.description && (
              <p className="text-muted-foreground mt-1">{database.description}</p>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <DatabaseView 
            databaseId={database.id} 
            workspaceId={workspaceId!}
          />
        </div>
      </div>
    </AppLayoutWithSidebar>
  );
}
