
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTemplate, Rocket, Users, TrendingUp, Package, Plus } from 'lucide-react';
import { useDatabaseTemplates } from '@/hooks/useDatabaseTemplates';
import { useToast } from '@/hooks/use-toast';
import { DatabaseTemplate } from '@/types/databaseTemplate';

interface TemplateGalleryProps {
  workspaceId: string;
  onTemplateSelect?: (templateId: string, customName?: string) => void;
  onClose?: () => void;
}

const CATEGORY_ICONS = {
  productivity: Rocket,
  sales: TrendingUp,
  marketing: FileTemplate,
  operations: Package,
  custom: Plus,
};

const CATEGORY_COLORS = {
  productivity: 'bg-blue-500',
  sales: 'bg-green-500',
  marketing: 'bg-purple-500',
  operations: 'bg-orange-500',
  custom: 'bg-gray-500',
};

export function TemplateGallery({ workspaceId, onTemplateSelect, onClose }: TemplateGalleryProps) {
  const { templates, loading, createDatabaseFromTemplate } = useDatabaseTemplates(workspaceId);
  const [selectedTemplate, setSelectedTemplate] = useState<DatabaseTemplate | null>(null);
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const systemTemplates = templates.filter(t => t.is_system_template);
  const userTemplates = templates.filter(t => !t.is_system_template);

  const groupedSystemTemplates = systemTemplates.reduce((acc, template) => {
    const category = template.category || 'custom';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, DatabaseTemplate[]>);

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    
    try {
      const { data, error } = await createDatabaseFromTemplate(
        selectedTemplate.id, 
        customName.trim() || undefined
      );

      if (error) throw new Error(error);

      toast({
        title: "Database created successfully!",
        description: `Your database "${customName || selectedTemplate.name}" has been created from the template.`,
      });

      if (onTemplateSelect && data) {
        onTemplateSelect(selectedTemplate.id, customName.trim() || undefined);
      }

      setSelectedTemplate(null);
      setCustomName('');
      onClose?.();

    } catch (error) {
      console.error('Error creating database from template:', error);
      toast({
        title: "Error creating database",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const TemplateCard = ({ template }: { template: DatabaseTemplate }) => {
    const IconComponent = CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS] || Plus;
    const colorClass = CATEGORY_COLORS[template.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-500';

    return (
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => setSelectedTemplate(template)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass} text-white`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
                {template.is_system_template && (
                  <Badge variant="outline" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm">
            {template.description}
          </CardDescription>
          
          {template.template_data.fields && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">
                {template.template_data.fields.length} fields included
              </p>
              <div className="flex flex-wrap gap-1">
                {template.template_data.fields.slice(0, 3).map((field, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {field.name}
                  </Badge>
                ))}
                {template.template_data.fields.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.template_data.fields.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose a Template</h2>
        <p className="text-muted-foreground">
          Get started quickly with pre-built database templates or browse custom templates from your workspace.
        </p>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system">System Templates</TabsTrigger>
          <TabsTrigger value="custom">Workspace Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          {Object.entries(groupedSystemTemplates).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold capitalize">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {userTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Custom Templates</h3>
              <p className="text-muted-foreground">
                Your workspace doesn't have any custom templates yet. Create a database and save it as a template to see it here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Configuration Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Template: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>
              
              <div>
                <Label htmlFor="custom-name">Database Name (optional)</Label>
                <Input
                  id="custom-name"
                  placeholder={selectedTemplate.name}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use the template name
                </p>
              </div>

              {selectedTemplate.template_data.fields && (
                <div>
                  <Label className="text-sm font-medium">Fields to be created:</Label>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {selectedTemplate.template_data.fields.map((field, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{field.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {field.type.toLowerCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTemplate(null)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleUseTemplate} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Database'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
