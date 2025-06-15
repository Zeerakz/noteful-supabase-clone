
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatabaseField, RelationFieldSettings } from '@/types/database';
import { Plus } from 'lucide-react';
import { useRelationFieldState } from './relation/useRelationFieldState';
import { SelectedRelationItems } from './relation/SelectedRelationItems';
import { RelationSelectorDialogContent } from './relation/RelationSelectorDialogContent';

interface RelationFieldEditorProps {
  value: string | string[] | null; // This will be ignored
  onChange: (value: string | string[] | null) => void; // This will not be called
  settings: RelationFieldSettings;
  workspaceId: string;
  isMultiple?: boolean;
  showBacklink?: boolean;
  onBacklinkToggle?: (enabled: boolean) => void;
  pageId: string;
  field: DatabaseField;
}

export function RelationFieldEditor({ 
  settings, 
  workspaceId, 
  isMultiple = false,
  showBacklink = false,
  onBacklinkToggle,
  pageId,
  field
}: RelationFieldEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localBacklink, setLocalBacklink] = useState(showBacklink);

  const {
    selectedPages,
    relatedPageIds,
    loadingRelations,
    pages,
    loadingTargetPages,
    handlePageSelect,
    handleRemove,
  } = useRelationFieldState({
    pageId,
    field,
    isMultiple,
    settings,
    workspaceId,
    onCloseDialog: () => setIsOpen(false),
  });

  const handleBacklinkToggle = (enabled: boolean) => {
    setLocalBacklink(enabled);
    if (onBacklinkToggle) {
      onBacklinkToggle(enabled);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected items display */}
      <div className="space-y-2">
        <SelectedRelationItems selectedPages={selectedPages} onRemove={handleRemove} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Add/Select button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {selectedPages.length === 0 ? 'Select items' : isMultiple ? 'Add more' : 'Change selection'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[600px] flex flex-col">
            <RelationSelectorDialogContent
              pages={pages}
              loadingTargetPages={loadingTargetPages}
              loadingRelations={loadingRelations}
              relatedPageIds={relatedPageIds}
              handlePageSelect={handlePageSelect}
              isMultiple={isMultiple}
              selectedPageCount={selectedPages.length}
            />
          </DialogContent>
        </Dialog>

        {/* Backlink toggle */}
        {onBacklinkToggle && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-backlink"
              checked={localBacklink}
              onCheckedChange={(checked) => handleBacklinkToggle(Boolean(checked))}
            />
            <Label 
              htmlFor="show-backlink" 
              className="text-sm cursor-pointer select-none"
            >
              Show backlink
            </Label>
          </div>
        )}
      </div>
    </div>
  );
}
