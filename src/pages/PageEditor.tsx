
import React, { useState, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { PresenceProvider } from '@/components/collaboration/PresenceProvider';
import { ActiveUsers } from '@/components/collaboration/ActiveUsers';
import { SaveAsTemplateDialog } from '@/components/templates/SaveAsTemplateDialog';
import { usePages } from '@/hooks/usePages';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePresence } from '@/hooks/usePresence';
import { useBlocks } from '@/hooks/useBlocks';
import { useToast } from '@/hooks/use-toast';

export function PageEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const navigate = useNavigate();
  const { pages, loading: pagesLoading, updatePage } = usePages(workspaceId);
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const { activeUsers, loading: presenceLoading } = usePresence(pageId);
  const { blocks } = useBlocks(pageId!);
  const { toast } = useToast();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  const startEditingTitle = () => {
    setTitleValue(page.title);
    setIsEditingTitle(true);
    // Focus the input after it renders
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const handleTitleSave = async () => {
    if (!titleValue.trim()) {
      toast({
        title: "Error",
        description: "Page title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (titleValue.trim() === page.title) {
      setIsEditingTitle(false);
      return;
    }

    const { error } = await updatePage(page.id, { title: titleValue.trim() });
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Page title updated",
      });
      setIsEditingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setTitleValue(page.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTitleCancel();
    }
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
                <div className="flex-1">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={titleInputRef}
                        value={titleValue}
                        onChange={(e) => setTitleValue(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleTitleKeyDown}
                        className="text-xl font-semibold border-none bg-transparent p-0 focus-visible:ring-1"
                        placeholder="Page title"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h1 className="text-xl font-semibold">{page.title}</h1>
                      {isEditable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={startEditingTitle}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
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
