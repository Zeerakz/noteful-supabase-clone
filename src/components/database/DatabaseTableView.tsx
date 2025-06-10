
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
import { Skeleton } from '@/components/ui/skeleton';
import { usePageProperties } from '@/hooks/usePageProperties';
import { DatabaseService } from '@/services/databaseService';
import { DatabaseField, PageProperty } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DatabaseTableViewProps {
  databaseId: string;
  workspaceId: string;
}

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
}

export function DatabaseTableView({ databaseId, workspaceId }: DatabaseTableViewProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [pages, setPages] = useState<PageWithProperties[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // For now, we'll show a placeholder table structure
  // In a full implementation, you'd fetch pages that belong to this database
  useEffect(() => {
    setLoading(false);
    // Mock data for demonstration
    setPages([]);
  }, [databaseId]);

  const handleCellEdit = async (pageId: string, fieldId: string, value: string) => {
    // This would update the page property
    console.log('Updating cell:', { pageId, fieldId, value });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Database Table View</h3>
        <Button size="sm" className="gap-2">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={fields.length + 1} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No pages in this database yet. Create your first database entry to get started.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.pageId}>
                  <TableCell className="font-medium">
                    <Input
                      value={page.title}
                      onChange={(e) => {
                        // Handle title update
                        console.log('Title update:', e.target.value);
                      }}
                      className="border-0 bg-transparent p-0 focus-visible:ring-0"
                    />
                  </TableCell>
                  {fields.map((field) => (
                    <TableCell key={field.id}>
                      <EditableCell
                        value={page.properties[field.id] || ''}
                        fieldType={field.type}
                        onSave={(value) => handleCellEdit(page.pageId, field.id, value)}
                      />
                    </TableCell>
                  ))}
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
  fieldType: string;
  onSave: (value: string) => void;
}

function EditableCell({ value, fieldType, onSave }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

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
        className="border-0 bg-transparent p-0 focus-visible:ring-1"
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
        <span className="text-muted-foreground italic">Empty</span>
      )}
    </div>
  );
}
