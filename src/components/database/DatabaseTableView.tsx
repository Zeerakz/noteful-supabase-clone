import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { DatabaseService } from '@/services/databaseService';
import { DatabaseField } from '@/types/database';
import { PageService } from '@/services/pageService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRetryableQuery } from '@/hooks/useRetryableQuery';

interface DatabaseTableViewProps {
  databaseId: string;
  workspaceId: string;
}

interface PageWithProperties {
  id: string;
  title: string;
  workspace_id: string;
  database_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  parent_page_id: string | null;
  order_index: number;
  properties: Record<string, string>;
}

export function DatabaseTableView({ databaseId, workspaceId }: DatabaseTableViewProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use retryable query for fields
  const { executeWithRetry: fetchFieldsWithRetry } = useRetryableQuery(
    () => DatabaseService.fetchDatabaseFields(databaseId),
    { maxRetries: 3, baseDelay: 1000 }
  );
  
  const { 
    pages, 
    loading: pagesLoading, 
    error: pagesError,
    refetch: refetchPages
  } = useFilteredDatabasePages({
    databaseId,
    filters: [],
    fields,
    sortRules: []
  });

  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  // Fetch database fields with retry logic
  useEffect(() => {
    const fetchFields = async () => {
      try {
        setFieldsLoading(true);
        setFieldsError(null);
        
        const { data, error } = await fetchFieldsWithRetry();
        
        if (error) {
          setFieldsError(error);
        } else {
          setFields(data || []);
        }
      } catch (err) {
        setFieldsError(err instanceof Error ? err.message : 'Failed to fetch fields');
      } finally {
        setFieldsLoading(false);
      }
    };

    if (databaseId) {
      fetchFields();
    }
  }, [databaseId, fetchFieldsWithRetry]);

  // Transform pages data with properties
  const pagesWithProperties: PageWithProperties[] = pages.map(page => {
    const properties: Record<string, string> = {};
    
    const pageProperties = (page as any).page_properties || [];
    pageProperties.forEach((prop: any) => {
      properties[prop.field_id] = prop.value || '';
    });

    return {
      id: page.id,
      title: page.title,
      workspace_id: page.workspace_id,
      database_id: page.database_id,
      created_by: page.created_by,
      created_at: page.created_at,
      updated_at: page.updated_at,
      parent_page_id: page.parent_page_id,
      order_index: page.order_index,
      properties,
    };
  });

  const handleCreateRow = async () => {
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
          description: "New row created",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create row",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRow = async (pageId: string) => {
    try {
      const { error } = await PageService.deletePage(pageId);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Row deleted",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive",
      });
    }
  };

  const handleTitleUpdate = async (pageId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const { error } = await PageService.updatePage(pageId, { title: newTitle.trim() });
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive",
      });
    }
  };

  const handlePropertyUpdate = (pageId: string, fieldId: string, value: string) => {
    propertyUpdateMutation.mutate({
      pageId,
      fieldId,
      value
    });
  };

  const handleRetry = () => {
    refetchPages();
  };

  if (fieldsLoading || pagesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (fieldsError || pagesError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{fieldsError || pagesError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Database Table View</h3>
        <Button onClick={handleCreateRow} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Title</TableHead>
              {fields.map((field) => (
                <TableHead key={field.id} className="min-w-[150px]">
                  {field.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({field.type})
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagesWithProperties.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={fields.length + 2} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No rows in this database yet. Click "Add Row" to create your first entry.
                </TableCell>
              </TableRow>
            ) : (
              pagesWithProperties.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">
                    <EditableCell
                      value={page.title}
                      onSave={(value) => handleTitleUpdate(page.id, value)}
                      placeholder="Enter title..."
                    />
                  </TableCell>
                  {fields.map((field) => (
                    <TableCell key={field.id}>
                      <EditableCell
                        value={page.properties[field.id] || ''}
                        onSave={(value) => handlePropertyUpdate(page.id, field.id, value)}
                        fieldType={field.type}
                        placeholder={`Enter ${field.name.toLowerCase()}...`}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRow(page.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No fields defined for this database.</p>
          <p className="text-sm">Add fields to start organizing your data.</p>
        </div>
      )}
    </div>
  );
}

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  fieldType?: string;
  placeholder?: string;
}

function EditableCell({ value, onSave, fieldType, placeholder = "Enter value..." }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
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
        className="border-0 bg-transparent p-0 focus-visible:ring-1"
        placeholder={placeholder}
        autoFocus
      />
    );
  }

  return (
    <div
      className="min-h-[20px] cursor-text hover:bg-muted/50 p-1 rounded"
      onClick={() => setIsEditing(true)}
    >
      {value || (
        <span className="text-muted-foreground italic">{placeholder}</span>
      )}
    </div>
  );
}
