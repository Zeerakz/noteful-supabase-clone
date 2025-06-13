
import React, { useState } from 'react';
import { DatabaseField } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditableCell } from './EditableCell';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface MobileSummaryCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  allFields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  workspaceId: string;
  isSelected?: boolean;
  onSelect?: (pageId: string, selected: boolean) => void;
}

export function MobileSummaryCard({
  page,
  fields,
  allFields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  workspaceId,
  isSelected = false,
  onSelect
}: MobileSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show first 2-3 fields in collapsed state, all fields when expanded
  const visibleFields = isExpanded ? allFields : fields.slice(0, 3);
  const hasMoreFields = fields.length > 3;

  const handleSelect = (checked: boolean) => {
    if (onSelect) {
      onSelect(page.id, checked);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteRow(page.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFieldDisplayValue = (field: DatabaseField, value: string) => {
    if (!value) return null;
    
    // Format different field types for mobile display
    switch (field.type) {
      case 'status':
      case 'select':
        return <Badge variant="secondary" className="text-xs">{value}</Badge>;
      case 'date':
        return <span className="text-xs text-muted-foreground">{value}</span>;
      case 'person':
        return <Badge variant="outline" className="text-xs">{value}</Badge>;
      default:
        return <span className="text-sm truncate">{value}</span>;
    }
  };

  return (
    <Card 
      className={cn(
        "p-4 transition-all duration-200 ease-out motion-content-drift-in",
        "hover:shadow-md border-border/50",
        isSelected && "ring-2 ring-primary/20 bg-accent/20"
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelect}
            className="mt-1 transition-opacity duration-200"
          />
          
          <div className="flex-1 min-w-0">
            <EditableCell
              value={page.title}
              onChange={(newTitle) => onTitleUpdate(page.id, newTitle)}
              placeholder="Untitled"
              className="text-base font-medium text-foreground p-0 hover:bg-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {hasMoreFields && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground motion-interactive"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground motion-interactive"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card Properties */}
      {visibleFields.length > 0 && (
        <div className="space-y-3">
          {visibleFields.map((field) => {
            const value = page.properties[field.id] || '';
            
            return (
              <div key={field.id} className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-0 flex-shrink-0">
                  {field.name}
                </div>
                
                <div className="flex-1 min-w-0 text-right">
                  {value ? (
                    getFieldDisplayValue(field, value)
                  ) : (
                    <EditableCell
                      value={value}
                      onChange={(newValue) => onPropertyUpdate(page.id, field.id, newValue)}
                      placeholder={`Add ${field.name.toLowerCase()}`}
                      field={field}
                      workspaceId={workspaceId}
                      pageId={page.id}
                      className="text-sm text-right justify-end min-h-[20px] p-1 text-muted-foreground/60 italic hover:bg-muted/20"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expansion indicator */}
      {hasMoreFields && !isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground motion-interactive"
          >
            Show {allFields.length - 3} more properties
          </Button>
        </div>
      )}
    </Card>
  );
}
