
import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { usePages } from '@/hooks/usePages';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export function PageView() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  
  // Find the page across all workspaces
  const allPages = workspaces.flatMap(workspace => {
    const { pages } = usePages(workspace.id);
    return pages.map(page => ({ ...page, workspace }));
  });
  
  const pageWithWorkspace = allPages.find(p => p.id === pageId);

  if (workspacesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!pageWithWorkspace) {
    return <Navigate to="/" replace />;
  }

  const { workspace, ...page } = pageWithWorkspace;

  const handleBack = () => {
    navigate(`/workspace/${workspace.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{page.title}</h1>
              <p className="text-sm text-muted-foreground">in {workspace.name}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto max-w-4xl">
        <BlockEditor pageId={page.id} isEditable={true} />
      </div>
    </div>
  );
}
