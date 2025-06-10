
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { usePages } from '@/hooks/usePages';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export function PageEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const { pages, loading: pagesLoading } = usePages(workspaceId);
  const { workspaces, loading: workspacesLoading } = useWorkspaces();

  if (pagesLoading || workspacesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const workspace = workspaces.find(w => w.id === workspaceId);
  const page = pages.find(p => p.id === pageId);

  if (!workspace || !page) {
    return <Navigate to="/" replace />;
  }

  // For now, we'll assume users can edit if they have access to the page
  // This should be enhanced with proper role checking
  const isEditable = true;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{page.title}</h1>
              <p className="text-sm text-gray-500">in {workspace.name}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto max-w-4xl">
        <BlockEditor pageId={page.id} isEditable={isEditable} />
      </div>
    </div>
  );
}
