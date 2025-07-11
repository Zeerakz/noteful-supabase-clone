
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useDatabases } from '@/hooks/useDatabases';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Database, Bookmark, Search, MoreHorizontal, Trash2, Settings, Users } from 'lucide-react';
import { DatabaseWizard } from '@/components/database/DatabaseWizard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { WorkspaceMembersModal } from './WorkspaceMembersModal';
import { ScrollArea } from '@/components/ui/scroll-area';

export function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  
  console.log('🏢 WorkspaceView rendering with workspaceId:', workspaceId);
  
  const { workspaces, loading: workspacesLoading, error: workspacesError } = useWorkspaces();
  const { pages, createPage, hasOptimisticChanges, loading: pagesLoading, error: pagesError } = useEnhancedPages(workspaceId!);
  const { databases, deleteDatabase, fetchDatabases, loading: databasesLoading, error: databasesError } = useDatabases(workspaceId!);
  const { openSearch } = useGlobalSearch();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [databaseToDelete, setDatabaseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const { toast } = useToast();

  // Add effect to log loading states
  useEffect(() => {
    console.log('🔄 WorkspaceView loading states:', {
      workspaceId,
      workspacesLoading,
      pagesLoading,
      databasesLoading,
      workspacesCount: workspaces?.length,
      pagesCount: pages?.length,
      databasesCount: databases?.length
    });
  }, [workspaceId, workspacesLoading, pagesLoading, databasesLoading, workspaces?.length, pages?.length, databases?.length]);

  // Add effect to log errors
  useEffect(() => {
    if (workspacesError) console.error('❌ Workspaces error:', workspacesError);
    if (pagesError) console.error('❌ Pages error:', pagesError);
    if (databasesError) console.error('❌ Databases error:', databasesError);
  }, [workspacesError, pagesError, databasesError]);

  const workspace = workspaces?.find(w => w.id === workspaceId);

  console.log('🏢 WorkspaceView state:', {
    workspace: workspace ? { id: workspace.id, name: workspace.name } : null,
    workspacesLoaded: !workspacesLoading,
    totalWorkspaces: workspaces?.length
  });

  // Show loading state if any critical data is still loading
  if (workspacesLoading || (!workspace && !workspacesError)) {
    console.log('⏳ WorkspaceView showing loading state');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading workspace...</div>
      </div>
    );
  }

  // Show error if workspace loading failed
  if (workspacesError) {
    console.error('❌ WorkspaceView showing workspace error:', workspacesError);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error loading workspace</p>
          <p className="text-muted-foreground text-sm">{workspacesError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show not found if workspace doesn't exist
  if (!workspace) {
    console.warn('⚠️ WorkspaceView workspace not found, available workspaces:', workspaces?.map(w => ({ id: w.id, name: w.name })));
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Workspace not found</p>
          <Button onClick={() => navigate('/')}>Back to Workspaces</Button>
        </div>
      </div>
    );
  }

  console.log('✅ WorkspaceView rendering workspace content for:', workspace.name);

  const handleCreatePage = async () => {
    if (!workspaceId) return;
    
    try {
      console.log('📝 Creating new page in workspace:', workspaceId);
      await createPage('Untitled Page', null);
    } catch (error) {
      console.error('❌ Error creating page:', error);
    }
  };

  const handlePageClick = (pageId: string) => {
    console.log('📄 Navigating to page:', pageId);
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
  };

  const handleDatabaseClick = (databaseId: string) => {
    console.log('🗄️ Navigating to database:', databaseId);
    navigate(`/workspace/${workspaceId}/database/${databaseId}`);
  };

  const handleTemplateGalleryClick = () => {
    navigate(`/workspace/${workspaceId}/templates`);
  };

  const handleSettingsClick = () => {
    navigate(`/workspace/${workspaceId}/settings`);
  };

  const handleDeleteDatabase = (database: { id: string; name: string }) => {
    setDatabaseToDelete(database);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDatabase = async () => {
    if (!databaseToDelete) return;

    try {
      const { error } = await deleteDatabase(databaseToDelete.id);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Database "${databaseToDelete.name}" deleted successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete database",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDatabaseToDelete(null);
    }
  };

  const handleDatabaseCreated = () => {
    // Force a refresh of databases when a new one is created
    fetchDatabases();
  };

  const breadcrumbs = [
    { 
      label: workspace.name + (hasOptimisticChanges ? ' (syncing...)' : '')
    }
  ];

  return (
    <AppLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Notion-style header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">{workspace.name}</h1>
                  {hasOptimisticChanges && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      Syncing...
                    </div>
                  )}
                </div>
                {workspace.description && (
                  <p className="text-muted-foreground text-lg">{workspace.description}</p>
                )}
              </div>
              {/* Notion-style action buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  onClick={openSearch} 
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                  Search
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleTemplateGalleryClick} 
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Bookmark className="h-4 w-4" />
                  Templates
                </Button>
                <DatabaseWizard onDatabaseCreated={handleDatabaseCreated} />
                <Button onClick={handleCreatePage} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setMembersModalOpen(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Members
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSettingsClick}>
                      <Settings className="h-4 w-4 mr-2" />
                      Workspace Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Show error states for individual sections */}
          {databasesError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">Error loading databases: {databasesError}</p>
            </div>
          )}

          {pagesError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">Error loading pages: {pagesError}</p>
            </div>
          )}

          {/* Quick Actions - Notion style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Button 
              variant="outline" 
              onClick={handleCreatePage}
              className="h-20 flex-col gap-2 hover:bg-muted/50"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">New Page</span>
            </Button>
            <div>
              <DatabaseWizard onDatabaseCreated={handleDatabaseCreated} />
            </div>
            <Button 
              variant="outline" 
              onClick={handleTemplateGalleryClick}
              className="h-20 flex-col gap-2 hover:bg-muted/50"
            >
              <Bookmark className="h-6 w-6" />
              <span className="text-sm">Templates</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={openSearch}
              className="h-20 flex-col gap-2 hover:bg-muted/50"
            >
              <Search className="h-6 w-6" />
              <span className="text-sm">Search</span>
            </Button>
          </div>

          {/* Databases Section */}
          {databases && databases.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Databases</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {databases.map((database) => (
                  <Card 
                    key={database.id} 
                    className="hover:shadow-lg hover:border-border/80 transition-all duration-200 cursor-pointer group relative border-border/50"
                    onClick={() => handleDatabaseClick(database.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Database className="h-4 w-4 text-primary" />
                          </div>
                          {database.name}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDatabase(database);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Database
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0" onClick={() => handleDatabaseClick(database.id)}>
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
            <h2 className="text-xl font-semibold text-foreground">Recent Pages</h2>
            {pagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading pages...</div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pages?.slice(0, 6).map((page) => (
                  <Card 
                    key={page.id} 
                    className="hover:shadow-lg hover:border-border/80 transition-all duration-200 cursor-pointer border-border/50 group"
                    onClick={() => handlePageClick(page.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <span className="truncate">{page.properties?.title || 'Untitled'}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(page.last_edited_time).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {(!pages || pages.length === 0) && (!databases || databases.length === 0) && !pagesLoading && !databasesLoading && (
                  <div className="col-span-full">
                    <Card className="border-dashed border-2 border-border/50">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Welcome to your workspace</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                          Start building your knowledge base by creating your first page or database.
                        </p>
                        <div className="flex gap-3">
                          <Button onClick={handleCreatePage} className="gap-2">
                            <FileText className="h-4 w-4" />
                            Create Page
                          </Button>
                          <DatabaseWizard onDatabaseCreated={handleDatabaseCreated} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Show more link if there are more pages */}
                {pages && pages.length > 6 && (
                  <Card className="border-dashed border-2 border-border/50 hover:border-border/80 transition-colors cursor-pointer">
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">
                          {pages.length - 6} more pages
                        </p>
                        <Button variant="ghost" size="sm" onClick={openSearch}>
                          View all pages
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Database</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{databaseToDelete?.name}"? This action cannot be undone and will permanently delete all data in this database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteDatabase}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Database
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </ScrollArea>
      <WorkspaceMembersModal 
        workspaceId={workspaceId!}
        isOpen={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
      />
    </AppLayoutWithSidebar>
  );
}
