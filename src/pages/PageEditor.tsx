
import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { PresenceProvider } from '@/components/collaboration/PresenceProvider';
import { ActiveUsers } from '@/components/collaboration/ActiveUsers';
import { SaveAsTemplateDialog } from '@/components/templates/SaveAsTemplateDialog';
import { usePages } from '@/hooks/usePages';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePresence } from '@/hooks/usePresence';
import { useBlocks } from '@/hooks/useBlocks';

export function PageEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const navigate = useNavigate();
  const { pages, loading: pagesLoading } = usePages(workspaceId);
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const { activeUsers, loading: presenceLoading } = usePresence(pageId);
  const { blocks } = useBlocks(pageId!);

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

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  return (
    <PresenceProvider pageId={pageId}>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
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
              
              <div className="flex items-center gap-3">
                {/* Save as Template button */}
                {blocks.length > 0 && (
                  <SaveAsTemplateDialog
                    pageId={page.id}
                    workspaceId={workspaceId!}
                    blocks={blocks}
                  />
                )}
                
                {/* Show active users */}
                <ActiveUsers activeUsers={activeUsers} loading={presenceLoading} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto max-w-4xl">
          <BlockEditor pageId={page.id} isEditable={isEditable} workspaceId={workspaceId} />
        </div>
      </div>
    </PresenceProvider>
  );
}
