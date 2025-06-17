
import React, { useState } from 'react';
import { DatabaseField, RelationFieldSettings } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, ExternalLink } from 'lucide-react';
import { RelationSelectorDialogContent } from './relation/RelationSelectorDialogContent';
import { useRelationFieldState } from './relation/useRelationFieldState';

interface RelationFieldEditorProps {
  field: DatabaseField;
  pageId: string;
  value?: string;
  onValueChange?: (value: string) => void;
  workspaceId: string;
}

export function RelationFieldEditor({
  field,
  pageId,
  value,
  onValueChange,
  workspaceId,
}: RelationFieldEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const settings = field.settings as RelationFieldSettings;
  const isMultiple = settings?.is_multiple || false;

  const {
    selectedPages,
    relatedPageIds,
    loadingRelations,
    handlePageSelect,
    handleRemove,
  } = useRelationFieldState({
    pageId,
    field,
    isMultiple,
    settings,
    workspaceId,
    onCloseDialog: () => setIsDialogOpen(false),
  });

  const selectedPageCount = relatedPageIds.length;

  return (
    <div className="space-y-2">
      {/* Selected items display */}
      {selectedPages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPages.map((page) => (
            <Badge key={page.id} variant="secondary" className="flex items-center gap-1">
              <span className="truncate max-w-32">
                {(page.properties as any)?.title || 'Untitled'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemove(page.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add relation button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {selectedPages.length === 0 
              ? `Add ${field.name}` 
              : isMultiple 
                ? `Add more ${field.name}` 
                : `Change ${field.name}`
            }
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <RelationSelectorDialogContent
            field={field}
            loadingRelations={loadingRelations}
            relatedPageIds={relatedPageIds}
            handlePageSelect={handlePageSelect}
            isMultiple={isMultiple}
            selectedPageCount={selectedPageCount}
          />
        </DialogContent>
      </Dialog>

      {loadingRelations && (
        <div className="text-xs text-muted-foreground">Loading relations...</div>
      )}
    </div>
  );
}
