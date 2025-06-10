
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
import { Plus, Trash2 } from 'lucide-react';
import { useDatabasePages } from '@/hooks/useDatabasePages';
import { usePageProperties } from '@/hooks/usePageProperties';
import { DatabaseService } from '@/services/databaseService';
import { PagePropertyService } from '@/services/pagePropertyService';
import { DatabaseField, PageProperty } from '@/types/database';
import { Page } from '@/types/page';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DatabaseTableViewProps {
  databaseId: string;
  workspaceId: string;
}

interface PageWithProperties extends Page {
  properties: Record<string, string>;
}

export function DatabaseTableView({ databaseId, workspaceId }: DatabaseTableViewProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [pagesWithProperties, setPagesWithProperties] = useState<PageWithProperties[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    pages, 
    loading: pagesLoading, 
    createDatabasePage, 
    updatePage, 
    deletePage 
  } = useDatabasePages(databaseId, workspaceId);

  // Fetch database fields
  useEffect(() => {
    const fetchFields = async () => {
      try {
        setFieldsLoading(true);
        const { data, error } = await DatabaseService.fetchDatabaseFields(databaseId);
        if (error) throw new Error(error);
        setFields(data || []);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to fetch fields',
          variant: "destructive",
        });
      } finally {
        setFieldsLoading(false);
      }
    };

    if (databaseId) {
      fetchFields();
    }
  }, [databaseId, toast]);

  // Fetch properties for all pages
  useEffect(() => {
    const fetchPageProperties = async () => {
      if (pages.length === 0) {
        setPagesWithProperties([]);
        return;
      }

      try {
        const pagesWithProps = await Promise.all(
          pages.map(async (page) => {
            const { data: properties } = await PagePropertyService.fetchPageProperties(page.id);
            const propertiesMap: Record<string, string> = {};
            
            if (properties) {
              properties.forEach(prop => {
                propertiesMap[prop.field_id] = prop.value || '';
              });
            }

            return {
              ...page,
              properties: propertiesMap,
            };
          })
        );

        setPagesWithProperties(pagesWithProps);
      } catch (err) {
        console.error('Error fetching page properties:', err);
      }
    };

    fetchPageProperties();
  }, [pages]);

  const handleCreateRow = async () => {
    try {
      const { error } = await createDatabasePage('Untitled');
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
      const { error } = await deletePage(pageId);
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
      const { error } = await updatePage(pageId, { title: newTitle.trim() });
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

  const handlePropertyUpdate = async (pageId: string, fieldId: string, value: string) => {
    if (!user) return;

    try {
      const { error } = await PagePropertyService.upsertPageProperty(
        pageId,
        fieldId,
        value,
        user.id
      );
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        // Update local state optimistically
        setPagesWithProperties(prev => 
          prev.map(page => 
            page.id === pageId 
              ? { 
                  ...page, 
                  properties: { 
                    ...page.properties, 
                    [fieldId]: value 
                  } 
                }
              : page
          )
        );
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
    }
  };

  if (fieldsLoading || pagesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
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

  // Update editValue when value prop changes
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
