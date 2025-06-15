import React, { useState, useEffect } from 'react';
import { Plus, Settings, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function WorkspaceList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { workspaces, loading, error, createWorkspace, deleteWorkspace } = useWorkspaces();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !error && workspaces.length === 1) {
      navigate(`/workspace/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaces, loading, error, navigate]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    const { error } = await createWorkspace(newWorkspaceName, newWorkspaceDescription);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Workspace created successfully!",
      });
      setIsCreateOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
    }
    
    setIsCreating(false);
  };

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await deleteWorkspace(workspaceId);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Workspace deleted successfully!",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Show loading while fetching workspaces
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading workspaces...</div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-lg text-red-600">Error loading workspaces</div>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
  }

  // If there's only one workspace, show a redirecting message while the effect runs.
  if (workspaces.length === 1 && !loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to your workspace...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Your Workspaces</h1>
          <p className="text-gray-600 mt-2">Manage your collaborative workspaces</p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">Signed in as {user.email}</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize your projects and collaborate with others.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWorkspace}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder="Enter workspace name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-description">Description (Optional)</Label>
                    <Textarea
                      id="workspace-description"
                      value={newWorkspaceDescription}
                      onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                      placeholder="Describe your workspace"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Workspace'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{workspace.name}</CardTitle>
                  {workspace.description && (
                    <CardDescription className="mt-2">
                      {workspace.description}
                    </CardDescription>
                  )}
                </div>
                {workspace.owner_user_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>
                    {workspace.owner_user_id === user?.id ? 'Owner' : 'Member'}
                  </span>
                  {workspace.is_public && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Public
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/workspace/${workspace.id}`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first workspace to start collaborating with your team.
          </p>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workspace
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}
    </div>
  );
}
