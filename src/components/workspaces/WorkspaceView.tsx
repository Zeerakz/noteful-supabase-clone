
import React, { useState } from 'react';
import { FileText, Plus, ChevronRight, ChevronDown, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePages, Page } from '@/hooks/usePages';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Workspace } from '@/hooks/useWorkspaces';

interface WorkspaceViewProps {
  workspace: Workspace;
}

interface PageTreeItemProps {
  page: Page;
  pages: Page[];
  onDeletePage: (pageId: string, pageTitle: string) => void;
  onNavigateToPage: (pageId: string) => void;
}

function PageTreeItem({ page, pages, onDeletePage, onNavigateToPage }: PageTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  
  const childPages = pages.filter(p => p.parent_page_id === page.id);
  const hasChildren = childPages.length > 0;
  const isOwner = page.created_by === user?.id;

  return (
    <div className="ml-4">
      <div className="flex items-center justify-between group py-1">
        <div className="flex items-center space-x-2 flex-1">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="h-6 w-6 flex items-center justify-center">
              <FileText className="h-3 w-3 text-gray-400" />
            </div>
          )}
          <span 
            className="text-sm hover:text-blue-600 cursor-pointer flex-1"
            onClick={() => onNavigateToPage(page.id)}
          >
            {page.title}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToPage(page.id)}
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeletePage(page.id, page.title)}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-2">
          {childPages.map((childPage) => (
            <PageTreeItem
              key={childPage.id}
              page={childPage}
              pages={pages}
              onDeletePage={onDeletePage}
              onNavigateToPage={onNavigateToPage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkspaceView({ workspace }: WorkspaceViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { pages, loading, createPage, deletePage } = usePages(workspace.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get top-level pages (no parent)
  const topLevelPages = pages.filter(page => !page.parent_page_id);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;

    setIsCreating(true);
    const { data, error } = await createPage(newPageTitle);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Page created successfully!",
      });
      setIsCreateOpen(false);
      setNewPageTitle('');
      
      // Navigate to the new page
      if (data) {
        navigate(`/workspace/${workspace.id}/page/${data.id}`);
      }
    }
    
    setIsCreating(false);
  };

  const handleDeletePage = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await deletePage(pageId);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Page deleted successfully!",
      });
    }
  };

  const handleNavigateToPage = (pageId: string) => {
    navigate(`/workspace/${workspace.id}/page/${pageId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-gray-600 mt-2">{workspace.description}</p>
          )}
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Create a new page in this workspace.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePage}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="page-title">Page Title</Label>
                  <Input
                    id="page-title"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Enter page title"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Page'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Pages</span>
          </CardTitle>
          <CardDescription>
            All pages in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topLevelPages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <FileText className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pages yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first page to start building your knowledge base.
              </p>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Page
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-2">
              {topLevelPages.map((page) => (
                <PageTreeItem
                  key={page.id}
                  page={page}
                  pages={pages}
                  onDeletePage={handleDeletePage}
                  onNavigateToPage={handleNavigateToPage}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
