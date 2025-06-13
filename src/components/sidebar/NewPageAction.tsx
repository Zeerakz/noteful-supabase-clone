
import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function NewPageAction() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createPage } = useEnhancedPages(workspaceId);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePage = async () => {
    if (!workspaceId || isCreating) return;
    
    setIsCreating(true);
    console.log('Creating new page...');
    
    try {
      const { data, error } = await createPage('Untitled Page');
      
      if (!error && data) {
        console.log('Page created successfully, navigating to:', data.id);
        navigate(`/workspace/${workspaceId}/page/${data.id}`);
        toast({
          title: "Success",
          description: "New page created successfully!",
        });
      } else if (error) {
        console.error('Failed to create page:', error);
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error creating page:', err);
      toast({
        title: "Error",
        description: "Failed to create page",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreatePage}
      disabled={isCreating || !workspaceId}
      className="w-full justify-start h-10"
      variant="default"
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 mr-2" />
      )}
      <span>New Page</span>
    </Button>
  );
}
