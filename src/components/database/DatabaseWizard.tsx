
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Database, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { TemplateGallery } from './TemplateGallery';
import { CreateDatabaseFromScratchForm } from './CreateDatabaseFromScratchForm';

interface DatabaseWizardProps {
  onDatabaseCreated?: () => void;
}

export function DatabaseWizard({ onDatabaseCreated }: DatabaseWizardProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const { toast } = useToast();

  const handleCreationSuccess = () => {
    setOpen(false);
    if (onDatabaseCreated) {
      onDatabaseCreated();
    }
  };

  const handleTemplateSelect = () => {
    setOpen(false);
    toast({
      title: "Database created from template!",
      description: "Your new database has been created successfully.",
    });
    
    if (onDatabaseCreated) {
      onDatabaseCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          New Database
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Database</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Use Template
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create from Scratch
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {workspaceId && (
              <TemplateGallery 
                workspaceId={workspaceId}
                onTemplateSelect={handleTemplateSelect}
                onClose={() => setOpen(false)}
              />
            )}
          </TabsContent>

          <TabsContent value="custom" className="pt-4">
            <CreateDatabaseFromScratchForm 
              onSuccess={handleCreationSuccess}
              onCancel={() => setOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
