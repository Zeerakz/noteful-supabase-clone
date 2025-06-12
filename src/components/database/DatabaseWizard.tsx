
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Database, Template } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { useDatabases } from '@/hooks/useDatabases';
import { TemplateGallery } from './TemplateGallery';

interface DatabaseField {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'INTEGER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Checkbox' },
  { value: 'TIMESTAMP WITH TIME ZONE', label: 'Date' },
  { value: 'UUID', label: 'Reference' },
  { value: 'JSONB', label: 'JSON' },
];

export function DatabaseWizard() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [isCreating, setIsCreating] = useState(false);
  const [databaseName, setDatabaseName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<DatabaseField[]>([
    {
      id: '1',
      name: 'title',
      type: 'TEXT',
      nullable: false,
    }
  ]);
  const { toast } = useToast();
  const { createDatabase } = useDatabases(workspaceId);

  const addField = () => {
    const newField: DatabaseField = {
      id: Date.now().toString(),
      name: '',
      type: 'TEXT',
      nullable: true,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<DatabaseField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const handleCreate = async () => {
    if (!databaseName.trim()) {
      toast({
        title: "Database name required",
        description: "Please enter a name for your database",
        variant: "destructive",
      });
      return;
    }

    if (!workspaceId) {
      toast({
        title: "Workspace required",
        description: "You must be in a workspace to create a database",
        variant: "destructive",
      });
      return;
    }

    const validFields = fields.filter(field => field.name.trim());
    if (validFields.length === 0) {
      toast({
        title: "Fields required",
        description: "Please add at least one field to your database",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await createDatabase({
        name: databaseName,
        description: description || undefined,
        fields: validFields.map(field => ({
          name: field.name,
          type: field.type,
          settings: { nullable: field.nullable }
        }))
      });

      if (error) throw new Error(error);

      toast({
        title: "Database created successfully!",
        description: `Your database "${databaseName}" has been created.`,
      });

      // Reset form
      setDatabaseName('');
      setDescription('');
      setFields([{
        id: '1',
        name: 'title',
        type: 'TEXT',
        nullable: false,
      }]);
      setOpen(false);

    } catch (error) {
      console.error('Error creating database:', error);
      toast({
        title: "Error creating database",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateSelect = () => {
    setOpen(false);
    toast({
      title: "Database created from template!",
      description: "Your new database has been created successfully.",
    });
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
              <Template className="h-4 w-4" />
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

          <TabsContent value="custom" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="database-name">Database Name</Label>
              <Input
                id="database-name"
                placeholder="e.g., tasks, projects, contacts"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
                disabled={isCreating}
              />
              {databaseName && (
                <p className="text-sm text-muted-foreground">
                  Table will be created as: <code>db_{databaseName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}</code>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="database-description">Description (optional)</Label>
              <Input
                id="database-description"
                placeholder="Describe what this database is for"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Fields</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addField}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Field Name</Label>
                      <Input
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        disabled={isCreating}
                      />
                    </div>
                    
                    <div className="w-40">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value })}
                        disabled={isCreating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-24">
                      <Label className="text-xs">Required</Label>
                      <Select
                        value={field.nullable ? 'optional' : 'required'}
                        onValueChange={(value) => updateField(field.id, { nullable: value === 'optional' })}
                        disabled={isCreating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Required</SelectItem>
                          <SelectItem value="optional">Optional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(field.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={isCreating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Database'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
