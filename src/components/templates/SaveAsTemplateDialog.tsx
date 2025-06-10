
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface SaveAsTemplateDialogProps {
  pageId: string;
  workspaceId: string;
  blocks: any[];
  children?: React.ReactNode;
}

export function SaveAsTemplateDialog({ pageId, workspaceId, blocks, children }: SaveAsTemplateDialogProps) {
  const [templateName, setTemplateName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { createTemplate } = useTemplates(workspaceId);
  const { toast } = useToast();

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return;

    try {
      const templateContent = {
        blocks: blocks.map(block => ({
          type: block.type,
          content: block.content,
          pos: block.pos,
        })),
      };

      const { error } = await createTemplate({
        name: templateName,
        content: templateContent,
        workspace_id: workspaceId,
      });

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
        description: "Page saved as template successfully",
      });

      setIsOpen(false);
      setTemplateName('');
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save page as template",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Save as Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Page as Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
