
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Kanban } from 'lucide-react';
import { DatabaseService } from '@/services/databaseService';
import { PagePropertyService } from '@/services/pagePropertyService';
import { DatabaseField, PageProperty } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface DatabaseKanbanViewProps {
  databaseId: string;
  workspaceId: string;
}

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
}

interface KanbanColumn {
  id: string;
  title: string;
  pages: PageWithProperties[];
}

export function DatabaseKanbanView({ databaseId, workspaceId }: DatabaseKanbanViewProps) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [pages, setPages] = useState<PageWithProperties[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Find the first select-type field for grouping
  const selectField = fields.find(field => field.type === 'select' || field.type === 'multi-select');

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
    // Mock data for demonstration - in real implementation, fetch from database
    setPages([]);
  }, [databaseId]);

  // Create columns based on select field options
  useEffect(() => {
    if (!selectField) {
      setColumns([]);
      return;
    }

    const options = selectField.settings?.options || [];
    const defaultColumns: KanbanColumn[] = options.map((option: string) => ({
      id: option.toLowerCase().replace(/\s+/g, '-'),
      title: option,
      pages: [],
    }));

    // Add "No Status" column for pages without a value
    defaultColumns.unshift({
      id: 'no-status',
      title: 'No Status',
      pages: [],
    });

    // Group pages by select field value
    const groupedColumns = defaultColumns.map(column => ({
      ...column,
      pages: pages.filter(page => {
        const fieldValue = page.properties[selectField.id];
        if (column.id === 'no-status') {
          return !fieldValue || fieldValue.trim() === '';
        }
        return fieldValue === column.title;
      }),
    }));

    setColumns(groupedColumns);
  }, [selectField, pages]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !selectField) return;

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the page being moved
    const pageId = draggableId;
    const newColumnId = destination.droppableId;
    const newStatus = newColumnId === 'no-status' ? '' : 
      columns.find(col => col.id === newColumnId)?.title || '';

    // Update the page property in the database
    if (user) {
      await PagePropertyService.upsertPageProperty(
        pageId,
        selectField.id,
        newStatus,
        user.id
      );
    }

    // Update local state optimistically
    const updatedColumns = columns.map(column => {
      // Remove page from source column
      if (column.id === source.droppableId) {
        return {
          ...column,
          pages: column.pages.filter(page => page.pageId !== pageId),
        };
      }
      
      // Add page to destination column
      if (column.id === destination.droppableId) {
        const movedPage = pages.find(page => page.pageId === pageId);
        if (movedPage) {
          const newPages = [...column.pages];
          newPages.splice(destination.index, 0, {
            ...movedPage,
            properties: {
              ...movedPage.properties,
              [selectField.id]: newStatus,
            },
          });
          return {
            ...column,
            pages: newPages,
          };
        }
      }

      return column;
    });

    setColumns(updatedColumns);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading kanban...</p>
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

  if (!selectField) {
    return (
      <div className="text-center py-12">
        <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Select Field Available</h3>
        <p className="text-muted-foreground mb-4">
          Kanban view requires at least one select-type field in your database to group by.
        </p>
        <p className="text-sm text-muted-foreground">
          Add a select field to your database to use the kanban view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Kanban View</h3>
          <p className="text-sm text-muted-foreground">
            Grouped by {selectField.name}
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              fields={fields}
            />
          ))}
        </div>
      </DragDropContext>

      {pages.length === 0 && (
        <div className="text-center py-8">
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No cards yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first database entry to see it on the kanban board.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Card
          </Button>
        </div>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  fields: DatabaseField[];
}

function KanbanColumn({ column, fields }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          {column.title}
        </h4>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {column.pages.length}
        </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
            }`}
          >
            {column.pages.map((page, index) => (
              <Draggable
                key={page.pageId}
                draggableId={page.pageId}
                index={index}
              >
                {(provided, snapshot) => (
                  <KanbanCard
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    page={page}
                    fields={fields}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <Button
        variant="ghost"
        size="sm"
        className="mt-3 gap-2 justify-start text-muted-foreground"
      >
        <Plus className="h-4 w-4" />
        Add card
      </Button>
    </div>
  );
}

interface KanbanCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  isDragging: boolean;
}

const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ page, fields, isDragging, ...props }, ref) => {
    // Show first few non-select fields
    const displayFields = fields.filter(
      field => field.type !== 'select' && field.type !== 'multi-select'
    ).slice(0, 3);

    return (
      <Card
        ref={ref}
        className={`cursor-grab active:cursor-grabbing transition-shadow ${
          isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
        }`}
        {...props}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {page.title || 'Untitled'}
          </CardTitle>
        </CardHeader>
        {displayFields.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-1">
              {displayFields.map((field) => (
                <div key={field.id} className="text-xs">
                  <span className="text-muted-foreground">{field.name}:</span>{' '}
                  <span className="text-foreground">
                    {page.properties[field.id] || 'Empty'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
);

KanbanCard.displayName = 'KanbanCard';
