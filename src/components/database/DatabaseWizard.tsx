
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';

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
  const [isCreating, setIsCreating] = useState(false);
  const [databaseName, setDatabaseName] = useState('');
  const [fields, setFields] = useState<DatabaseField[]>([
    {
      id: '1',
      name: 'title',
      type: 'TEXT',
      nullable: false,
    }
  ]);
  const { toast } = useToast();

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

  const generateSQL = () => {
    if (!databaseName.trim()) return '';

    const tableName = `db_${databaseName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    
    const fieldDefinitions = fields
      .filter(field => field.name.trim())
      .map(field => {
        const columnName = field.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        let definition = `  ${columnName} ${field.type}`;
        
        if (!field.nullable) {
          definition += ' NOT NULL';
        }
        
        if (field.defaultValue) {
          definition += ` DEFAULT ${field.defaultValue}`;
        }
        
        return definition;
      });

    if (fieldDefinitions.length === 0) return '';

    const sql = `-- Create ${databaseName} database table
CREATE TABLE public.${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
${fieldDefinitions.join(',\n')},
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS on ${tableName} table
ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view records in their workspaces
CREATE POLICY "Users can view ${tableName} in accessible workspaces" ON public.${tableName}
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
  );

-- Create policy for users to create records
CREATE POLICY "Users can create ${tableName}" ON public.${tableName}
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Create policy for users to update records
CREATE POLICY "Users can update their ${tableName}" ON public.${tableName}
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Create policy for users to delete records
CREATE POLICY "Users can delete their ${tableName}" ON public.${tableName}
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_${tableName}_created_by ON public.${tableName}(created_by);
CREATE INDEX idx_${tableName}_created_at ON public.${tableName}(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_${tableName}_updated_at 
  BEFORE UPDATE ON public.${tableName} 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

    return sql;
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create a database');
      }

      // Create database record (we'll implement this when we have a databases table)
      // For now, just create the fields
      const fieldsToCreate = validFields.map((field, index) => ({
        database_id: `temp_${Date.now()}`, // We'll need a proper database_id later
        name: field.name,
        type: field.type,
        settings: field.nullable ? { nullable: true } : { nullable: false },
        pos: index,
        created_by: user.id,
      }));

      // For MVP, just show the SQL to copy
      const sql = generateSQL();
      
      // Copy SQL to clipboard
      await navigator.clipboard.writeText(sql);

      toast({
        title: "Database SQL Generated!",
        description: "The database creation SQL has been copied to your clipboard. Please run it in your Supabase SQL editor to create the database table.",
      });

      // Reset form
      setDatabaseName('');
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          New Database
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Database</DialogTitle>
        </DialogHeader>
        
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
              {isCreating ? 'Creating...' : 'Generate Database'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
