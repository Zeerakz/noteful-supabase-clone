
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

  const handleTitleChange = async (newTitle: string) => {
    try {
      const { error } = await DatabaseService.updateDatabase(database.id, {
        name: newTitle
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Database title updated",
        });
        fetchDatabases(); // Refresh the databases list
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update database title",
        variant: "destructive",
      });
    }
  };

  const handleDescriptionChange = async (newDescription: string) => {
    try {
      const { error } = await DatabaseService.updateDatabase(database.id, {
        description: newDescription
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Database description updated",
        });
        fetchDatabases(); // Refresh the databases list
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update database description",
        variant: "destructive",
      });
    }
  };

  const handleIconChange = async (newIcon: string) => {
    try {
      const { error } = await DatabaseService.updateDatabase(database.id, {
        icon: newIcon
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Database icon updated",
        });
        fetchDatabases(); // Refresh the databases list
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update database icon",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <div className="flex flex-col h-full">
        <div className="shrink-0">
          <DatabaseHeader
            title={database.name}
            description={database.description}
            icon={database.icon || "📊"}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onIconChange={handleIconChange}
            breadcrumbs={breadcrumbs}
          />
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
