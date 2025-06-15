import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { PresenceProvider } from '@/components/collaboration/PresenceProvider';
import { ActiveUsers } from '@/components/collaboration/ActiveUsers';
import { SaveAsTemplateDialog } from '@/components/templates/SaveAsTemplateDialog';
import { usePageData } from '@/hooks/usePageData';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePresence } from '@/hooks/usePresence';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { useToast } from '@/hooks/use-toast';

export function PageEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize all hooks at the top
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Call ALL hooks before any conditional logic
  const { pageData, loading: pageLoading, error: pageError } = usePageData(pageId);
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const { activeUsers, loading: presenceLoading } = usePresence(pageId);
  const { blocks, hasOptimisticChanges: hasBlockChanges } = useEnhancedBlocks(pageId, workspaceId);
  const { updatePage, hasOptimisticChanges: hasPageChanges } = useEnhancedPages(workspaceId);

  useEffect(() => {
    if (pageData) {
      setTitleValue(pageData.properties?.title || 'Untitled');
    }
  }, [pageData]);


  // Now handle conditional rendering after all hooks are called
  if (!workspaceId || !pageId) {
    return <Navigate to="/" replace />;
  }

  if (pageLoading || workspacesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (pageError || !pageData) {
    return <Navigate to="/" replace />;
  }

  const workspace = pageData.workspace;
  const page = pageData;

  // For now, we'll assume users can edit if they have access to the page
  // This should be enhanced with proper role checking
  const isEditable = true;

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  const startEditingTitle = () => {
    setTitleValue(page.properties?.title || 'Untitled');
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

    if (titleValue.trim() === ((page.properties as any)?.title || 'Untitled')) {
      setIsEditingTitle(false);
      return;
    }
    
    // The properties object needs to be spread to avoid losing other properties
    const newProperties = { ...page.properties, title: titleValue.trim() };

    const { error } = await updatePage(page.id, { properties: newProperties });
    
    if (!error) {
      setIsEditingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setTitleValue((page.properties as any)?.title || 'Untitled');
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

  const hasAnyOptimisticChanges = hasPageChanges || hasBlockChanges;

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
                      <h1 className="text-xl font-semibold">{(page.properties as any)?.title || 'Untitled'}</h1>
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
                      {hasAnyOptimisticChanges && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-2" title="Syncing changes..." />
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
                    title={(page.properties as any)?.title || 'Untitled'}
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
