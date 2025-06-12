
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePages } from '@/hooks/usePages';
import { useDatabases } from '@/hooks/useDatabases';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Database, Bookmark, Search, MoreHorizontal, Trash2 } from 'lucide-react';
import { DatabaseWizard } from '@/components/database/DatabaseWizard';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
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

export function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { workspaces } = useWorkspaces();
  const { pages, createPage } = usePages(workspaceId!);
  const { databases, deleteDatabase, fetchDatabases } = useDatabases(workspaceId!);
  const { openSearch } = useGlobalSearch();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [databaseToDelete, setDatabaseToDelete] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

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

  const handlePageClick = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
  };

  const handleDatabaseClick = (databaseId: string) => {
    navigate(`/workspace/${workspaceId}/database/${databaseId}`);
  };

  const handleTemplateGalleryClick = () => {
    navigate(`/workspace/${workspaceId}/templates`);
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
          <DarkModeToggle />
          <Button variant="outline" onClick={openSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Search
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button variant="outline" onClick={handleTemplateGalleryClick} className="gap-2">
            <Bookmark className="h-4 w-4" />
            Templates
          </Button>
          <DatabaseWizard onDatabaseCreated={handleDatabaseCreated} />
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
              <Card 
                key={database.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group relative"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle 
                      className="text-base flex items-center gap-2 flex-1"
                      onClick={() => handleDatabaseClick(database.id)}
                    >
                      <Database className="h-4 w-4" />
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
        <h2 className="text-lg font-semibold">Pages</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages?.map((page) => (
            <Card 
              key={page.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handlePageClick(page.id)}
            >
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
                  <DatabaseWizard onDatabaseCreated={handleDatabaseCreated} />
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
  );
}
