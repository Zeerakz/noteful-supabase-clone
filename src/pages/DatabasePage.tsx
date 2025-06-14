
import React from 'react';
import { useParams, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useDatabases } from '@/hooks/useDatabases';
import { useToast } from '@/hooks/use-toast';
import { DatabaseView } from '@/components/database/DatabaseView';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { SidePeekPage } from '@/pages/SidePeekPage';

export function DatabasePage() {
  const { workspaceId, databaseId } = useParams<{ workspaceId: string; databaseId: string }>();
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const { databases, loading: databasesLoading } = useDatabases(workspaceId);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const peekPageId = searchParams.get('peek');

  const handlePeekOpenChange = (open: boolean) => {
    if (!open) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('peek');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  };

  if (workspacesLoading || databasesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const workspace = workspaces.find(w => w.id === workspaceId);
  const database = databases.find(d => d.id === databaseId);

  if (!workspace || !database || !workspaceId) {
    return <Navigate to="/" replace />;
  }

  const breadcrumbs = [
    { label: workspace.name, href: `/workspace/${workspaceId}` },
    { label: database.name }
  ];

  const handleEdit = async () => {
    toast({
      title: "Edit Database",
      description: "Edit functionality will be implemented soon",
    });
  };

  const handleDuplicate = async () => {
    toast({
      title: "Duplicate Database",
      description: "Duplicate functionality will be implemented soon",
    });
  };

  const handleDelete = async () => {
    toast({
      title: "Delete Database",
      description: "Delete functionality will be implemented soon",
    });
  };

  const handleExport = async () => {
    toast({
      title: "Export Database",
      description: "Export functionality will be implemented soon",
    });
  };

  return (
    <AppLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <DatabaseView workspaceId={workspaceId} />
        </div>
      </div>
      {peekPageId && (
        <SidePeekPage
          pageId={peekPageId}
          onOpenChange={handlePeekOpenChange}
        />
      )}
    </AppLayoutWithSidebar>
  );
}

