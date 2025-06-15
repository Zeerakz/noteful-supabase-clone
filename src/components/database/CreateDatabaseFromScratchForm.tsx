
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDatabases } from '@/hooks/useDatabases';
import { DatabaseFieldRow, DatabaseField } from './DatabaseFieldRow';

interface CreateDatabaseFromScratchFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateDatabaseFromScratchForm({ onSuccess, onCancel }: CreateDatabaseFromScratchFormProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [databaseName, setDatabaseName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<DatabaseField[]>([
    {
      id: '1',
      name: 'title',
      type: 'text',
      nullable: false,
    }
  ]);
  const { toast } = useToast();
  const { createDatabase } = useDatabases(workspaceId);

  const addField = () => {
    const newField: DatabaseField = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
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
      const { error } = await createDatabase({
        name: databaseName,
        description: description || undefined,
        fields: validFields.map(field => ({
          name: field.name,
          type: field.type,
          settings: { nullable: field.nullable }
        }))
      });

      if (error) throw new Error(String(error));

      toast({
        title: "Database created successfully!",
        description: `Your database "${databaseName}" has been created.`,
      });
      
      onSuccess();

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

  return (
    <div className="space-y-6">
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
          {fields.map((field) => (
            <DatabaseFieldRow
              key={field.id}
              field={field}
              isCreating={isCreating}
              canBeDeleted={fields.length > 1}
              onUpdateField={updateField}
              onRemoveField={removeField}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
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
    </div>
  );
}
