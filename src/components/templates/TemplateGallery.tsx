
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function TemplateGallery() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { templates, loading, createPageFromTemplate, deleteTemplate } = useTemplates(workspaceId);
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [pageName, setPageName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const { data, error } = await createPageFromTemplate(selectedTemplate, pageName);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        toast({
          title: "Success",
          description: "Page created from template successfully",
        });
        
        // Navigate to the new page
        navigate(`/workspace/${workspaceId}/page/${data.id}`);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create page from template",
        variant: "destructive",
      });
    } finally {
      setIsDialogOpen(false);
      setSelectedTemplate(null);
      setPageName('');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await deleteTemplate(templateId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Template Gallery</h2>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first template by saving a page as a template
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {template.name}
                  </div>
                  {user?.id === template.created_by && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Created {new Date(template.created_at).toLocaleDateString()}
                </p>
                <Dialog open={isDialogOpen && selectedTemplate === template.id} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    setSelectedTemplate(null);
                    setPageName('');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setPageName(`${template.name} Page`);
                        setIsDialogOpen(true);
                      }}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Use Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Page from Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="pageName">Page Name</Label>
                        <Input
                          id="pageName"
                          value={pageName}
                          onChange={(e) => setPageName(e.target.value)}
                          placeholder="Enter page name"
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateFromTemplate} disabled={!pageName.trim()}>
                          Create Page
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
