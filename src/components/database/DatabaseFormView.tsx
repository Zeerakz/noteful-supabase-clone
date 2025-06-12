import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, X } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { FieldEditor } from './fields/FieldEditor';
import { useDatabasePages } from '@/hooks/useDatabasePages';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';

interface DatabaseFormViewProps {
  databaseId: string;
  fields: DatabaseField[];
  workspaceId: string;
}

export function DatabaseFormView({ databaseId, fields, workspaceId }: DatabaseFormViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { fetchPages } = useDatabasePages(databaseId, workspaceId);
  const { toast } = useToast();

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setFormData({});
    setTitle('');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setFormData({});
    setTitle('');
  };

  const handleSubmit = async () => {
    if (!user || !title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the entry.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the page first
      const { data: page, error: pageError } = await DatabaseService.createDatabasePage(
        databaseId,
        user.id,
        title.trim()
      );

      if (pageError || !page) {
        throw new Error(pageError || 'Failed to create page');
      }

      // Then create the properties
      const propertyPromises = Object.entries(formData).map(([fieldId, value]) => {
        if (value.trim()) {
          return DatabaseService.createPageProperty(page.id, fieldId, value, user.id);
        }
        return Promise.resolve({ error: null });
      });

      const propertyResults = await Promise.all(propertyPromises);
      const propertyErrors = propertyResults.filter(result => result.error);

      if (propertyErrors.length > 0) {
        console.warn('Some properties failed to create:', propertyErrors);
      }

      toast({
        title: "Success",
        description: "Entry created successfully!",
      });

      // Reset form and refresh data
      handleCancel();
      fetchPages();
    } catch (error) {
      console.error('Error creating entry:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCreating) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Create New Entry</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a new entry to this database using the form view
                </p>
              </div>
              <Button onClick={handleStartCreate} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Create New Entry</span>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter entry title..."
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-sm font-medium">{field.name}</label>
              <FieldEditor
                field={field}
                value={formData[field.id] || null}
                onChange={(value) => handleFieldChange(field.id, value)}
                workspaceId={workspaceId}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !title.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Entry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
