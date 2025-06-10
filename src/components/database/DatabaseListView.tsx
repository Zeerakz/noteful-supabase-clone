
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { DatabaseService } from '@/services/databaseService';
import { PagePropertyService } from '@/services/pagePropertyService';
import { DatabaseField, PageProperty } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

interface DatabaseListViewProps {
  databaseId: string;
  workspaceId: string;
}

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
}

export function DatabaseListView({ databaseId, workspaceId }: DatabaseListViewProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [pages, setPages] = useState<PageWithProperties[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch database fields
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const { data, error } = await DatabaseService.fetchDatabaseFields(databaseId);
        if (error) throw new Error(error);
        setFields(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch fields');
      }
    };

    if (databaseId) {
      fetchFields();
    }
  }, [databaseId]);

  // For now, we'll show a placeholder structure
  // In a full implementation, you'd fetch pages that belong to this database
  useEffect(() => {
    setLoading(false);
    // Mock data for demonstration
    setPages([]);
  }, [databaseId]);

  const handleFieldEdit = async (pageId: string, fieldId: string, value: string) => {
    if (!user) return;
    
    try {
      const { error } = await PagePropertyService.upsertPageProperty(
        pageId,
        fieldId,
        value,
        user.id
      );
      
      if (error) {
        console.error('Failed to update property:', error);
      } else {
        // Update local state
        setPages(prev => prev.map(page => 
          page.pageId === pageId 
            ? { ...page, properties: { ...page.properties, [fieldId]: value } }
            : page
        ));
      }
    } catch (err) {
      console.error('Error updating property:', err);
    }
  };

  const handleTitleEdit = async (pageId: string, title: string) => {
    // This would update the page title in the pages table
    console.log('Updating page title:', { pageId, title });
    // TODO: Implement page title update
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // Get the first 3-4 fields to display as major fields
  const majorFields = fields.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Database List View</h3>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <Edit className="h-12 w-12 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2">No entries yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first database entry to see it as a card here.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Entry
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <DatabaseCard
              key={page.pageId}
              page={page}
              fields={majorFields}
              onFieldEdit={handleFieldEdit}
              onTitleEdit={handleTitleEdit}
            />
          ))}
        </div>
      )}

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No fields defined for this database.</p>
          <p className="text-sm">Add fields to start organizing your data.</p>
        </div>
      )}
    </div>
  );
}

interface DatabaseCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  onFieldEdit: (pageId: string, fieldId: string, value: string) => void;
  onTitleEdit: (pageId: string, title: string) => void;
}

function DatabaseCard({ page, fields, onFieldEdit, onTitleEdit }: DatabaseCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <EditableTitle
            value={page.title}
            onSave={(title) => onTitleEdit(page.pageId, title)}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {field.name}
            </label>
            <EditableField
              value={page.properties[field.id] || ''}
              fieldType={field.type}
              onSave={(value) => onFieldEdit(page.pageId, field.id, value)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface EditableTitleProps {
  value: string;
  onSave: (value: string) => void;
}

function EditableTitle({ value, onSave }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="font-semibold"
        autoFocus
      />
    );
  }

  return (
    <div
      className="cursor-text hover:bg-muted/50 p-1 rounded min-h-[24px] font-semibold"
      onClick={() => setIsEditing(true)}
    >
      {value || (
        <span className="text-muted-foreground italic font-normal">Untitled</span>
      )}
    </div>
  );
}

interface EditableFieldProps {
  value: string;
  fieldType: string;
  onSave: (value: string) => void;
}

function EditableField({ value, fieldType, onSave }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-sm"
        autoFocus
      />
    );
  }

  return (
    <div
      className="cursor-text hover:bg-muted/50 p-2 rounded min-h-[32px] text-sm border border-transparent hover:border-border transition-colors"
      onClick={() => setIsEditing(true)}
    >
      {value || (
        <span className="text-muted-foreground italic">Empty</span>
      )}
    </div>
  );
}
