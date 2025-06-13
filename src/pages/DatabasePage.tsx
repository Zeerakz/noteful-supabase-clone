
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useDatabases } from '@/hooks/useDatabases';
import { useToast } from '@/hooks/use-toast';
import { DatabaseView } from '@/components/database/DatabaseView';
import { DatabaseHeader } from '@/components/database/DatabaseHeader';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { DatabaseService } from '@/services/databaseService';

export function DatabasePage() {
  const { workspaceId, databaseId } = useParams<{ workspaceId: string; databaseId: string }>();
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const { databases, loading: databasesLoading, fetchDatabases } = useDatabases(workspaceId);
  const { toast } = useToast();

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

  const handleEdit = async () => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit Database",
      description: "Edit functionality will be implemented soon",
    });
  };

  const handleDuplicate = async () => {
    // TODO: Implement duplicate functionality
    toast({
      title: "Duplicate Database",
      description: "Duplicate functionality will be implemented soon",
    });
  };

  const handleDelete = async () => {
    // TODO: Implement delete functionality
    toast({
      title: "Delete Database",
      description: "Delete functionality will be implemented soon",
    });
  };

  const handleExport = async () => {
    // TODO: Implement export functionality
    toast({
      title: "Export Database",
      description: "Export functionality will be implemented soon",
    });
  };

  return (
    <AppLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="shrink-0">
          <DatabaseHeader
            database={database}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <DatabaseView 
            databaseId={database.id} 
            workspaceId={workspaceId!}
          />
        </div>
      </div>
    </AppLayoutWithSidebar>
  );
}
