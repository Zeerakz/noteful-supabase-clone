
import React from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePages } from '@/hooks/usePages';
import { useDatabases } from '@/hooks/useDatabases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Database } from 'lucide-react';
import { DatabaseWizard } from '@/components/database/DatabaseWizard';

export function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces } = useWorkspaces();
  const { pages, createPage } = usePages(workspaceId!);
  const { databases } = useDatabases(workspaceId!);

  const workspace = workspaces?.find(w => w.id === workspaceId);

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  const handleCreatePage = async () => {
    if (!workspaceId) return;
    
    try {
      await createPage('Untitled Page', null);
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-muted-foreground mt-1">{workspace.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <DatabaseWizard />
          <Button onClick={handleCreatePage} className="gap-2">
            <Plus className="h-4 w-4" />
            New Page
          </Button>
        </div>
      </div>

      {/* Databases Section */}
      {databases && databases.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Databases</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {databases.map((database) => (
              <Card key={database.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {database.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {database.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {database.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Table: {database.table_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(database.created_at!).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pages Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Pages</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages?.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {page.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Created {new Date(page.created_at!).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}

          {(!pages || pages.length === 0) && (!databases || databases.length === 0) && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="flex items-center gap-4 mb-4">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <Database className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Get started</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first page or database to start organizing your content
                </p>
                <div className="flex gap-2">
                  <DatabaseWizard />
                  <Button onClick={handleCreatePage} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
