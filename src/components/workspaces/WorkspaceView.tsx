
import React from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePages } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText } from 'lucide-react';
import { DatabaseWizard } from '@/components/database/DatabaseWizard';

export function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces } = useWorkspaces();
  const { pages, createPage } = usePages(workspaceId!);

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
      await createPage({
        title: 'Untitled Page',
        parentPageId: null,
      });
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

        {(!pages || pages.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No pages yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first page or database
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
  );
}
