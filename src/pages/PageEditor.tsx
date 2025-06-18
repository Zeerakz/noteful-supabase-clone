
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { PresenceProvider } from '@/components/collaboration/PresenceProvider';
import { ActiveUsers } from '@/components/collaboration/ActiveUsers';
import { SaveAsTemplateDialog } from '@/components/templates/SaveAsTemplateDialog';
import { ShareButton } from '@/components/sharing/ShareButton';
import { usePageData } from '@/hooks/usePageData';
import { useEnhancedPagesWithRealtime } from '@/hooks/useEnhancedPagesWithRealtime';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePresence } from '@/hooks/usePresence';
import { useEnhancedBlocksWithRealtime } from '@/hooks/useEnhancedBlocksWithRealtime';
import { useToast } from '@/hooks/use-toast';
import { useBlockPermissions } from '@/hooks/useBlockPermissions';

// Import to register the new property type
import '@/components/property/types/AiAutofillPropertyType';

export function PageEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize all hooks at the top
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Use the enhanced realtime hooks
  const { pageData, loading: pageLoading, error: pageError } = usePageData(pageId);
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const { activeUsers, loading: presenceLoading } = usePresence(pageId);
  const { blocks, hasOptimisticChanges: hasBlockChanges } = useEnhancedBlocksWithRealtime(pageId, workspaceId);
  const { updatePage, hasOptimisticChanges: hasPageChanges } = useEnhancedPagesWithRealtime(workspaceId);
  const { permissions, loading: permissionsLoading } = useBlockPermissions(pageId);

  useEffect(() => {
    if (pageData) {
      setTitleValue(pageData.properties?.title || 'Untitled');
    }
  }, [pageData]);

  // Now handle conditional rendering after all hooks are called
  if (!workspaceId || !pageId) {
    return <Navigate to="/" replace />;
  }

  if (pageLoading || workspacesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
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
  const isEditable = permissions.canEdit;

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
    
    const newProperties = { ...page.properties, title: titleValue.trim() };
    const { error } = await updatePage(page.id, { properties: newProperties });
    
    if (!error) {
      setIsEditingTitle(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to update page title. Please try again.",
        variant: "destructive",
      });
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
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left section */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 px-3 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                <div className="flex flex-col">
                  {isEditingTitle ? (
                    <div className="flex items-center">
                      <Input
                        ref={titleInputRef}
                        value={titleValue}
                        onChange={(e) => setTitleValue(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleTitleKeyDown}
                        className="text-xl font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Page title"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h1 className="text-xl font-semibold text-foreground">
                        {(page.properties as any)?.title || 'Untitled'}
                      </h1>
                      {isEditable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={startEditingTitle}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-muted"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                      {hasAnyOptimisticChanges && (
                        <span 
                          className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-2" 
                          title="Syncing changes..." 
                        />
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    in {workspace.name}
                  </p>
                </div>
              </div>
              
              {/* Right section */}
              <div className="flex items-center gap-2">
                {permissions.canManagePermissions && (
                  <ShareButton blockId={page.id} workspaceId={workspaceId} />
                )}
                
                {isEditable && blocks.length > 0 && (
                  <SaveAsTemplateDialog
                    pageId={page.id}
                    workspaceId={workspaceId!}
                    title={(page.properties as any)?.title || 'Untitled'}
                    blocks={blocks}
                  />
                )}
                
                <ActiveUsers activeUsers={activeUsers} loading={presenceLoading} />
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="mx-auto max-w-3xl px-4 py-6">
          <BlockEditor 
            pageId={page.id} 
            isEditable={isEditable} 
            workspaceId={workspaceId} 
          />
        </main>
      </div>
    </PresenceProvider>
  );
}
