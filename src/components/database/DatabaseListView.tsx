import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { PageService } from '@/services/pageService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DatabaseListViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
}

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
}

export function DatabaseListView({ 
  databaseId, 
  workspaceId, 
  fields, 
  filterGroup, 
  sortRules 
}: DatabaseListViewProps) {
  const { pages, loading, error, refetch } = useFilteredDatabasePages({
    databaseId,
    filterGroup,
    fields,
    sortRules,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  // Transform pages data to expected format - simplified
  const pagesWithProperties: PageWithProperties[] = pages.map(page => {
    const properties: Record<string, string> = {};
    
    if (page.page_properties && Array.isArray(page.page_properties)) {
      page.page_properties.forEach((prop: any) => {
        if (prop.field_id && prop.value !== undefined) {
          properties[prop.field_id] = prop.value || '';
        }
      });
    }
    
    return {
      pageId: page.id,
      title: page.title,
      properties,
    };
  });

  const handleFieldEdit = (pageId: string, fieldId: string, value: string) => {
    console.log('DatabaseListView: Field edit triggered', { pageId, fieldId, value });
    propertyUpdateMutation.mutate({
      pageId,
      fieldId,
      value
    });
  };

  const handleTitleEdit = async (pageId: string, title: string) => {
    try {
      const { error } = await PageService.updatePage(pageId, { title: title.trim() });
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        refetch();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive",
      });
    }
  };

  const handleCreateEntry = async () => {
    if (!user) return;

    try {
      const { data, error } = await PageService.createPage(
        workspaceId,
        user.id,
        { title: 'Untitled', databaseId }
      );
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "New entry created",
        });
        refetch();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create entry",
        variant: "destructive",
      });
    }
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
        <Button onClick={refetch} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  // Get the first 3-4 fields to display as major fields
  const majorFields = fields.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Database List View</h3>
        <Button size="sm" className="gap-2" onClick={handleCreateEntry}>
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {pagesWithProperties.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <Edit className="h-12 w-12 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2">No entries yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first database entry to see it as a card here.
          </p>
          <Button className="gap-2" onClick={handleCreateEntry}>
            <Plus className="h-4 w-4" />
            Create First Entry
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pagesWithProperties.map((page) => (
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
