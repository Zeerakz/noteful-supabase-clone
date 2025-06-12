
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import { DatabaseField, SavedDatabaseView } from '@/types/database';

interface FieldVisibilityManagerProps {
  fields: DatabaseField[];
  currentView: SavedDatabaseView | null;
  onVisibilityUpdate: (visibleFieldIds: string[]) => void;
}

export function FieldVisibilityManager({
  fields,
  currentView,
  onVisibilityUpdate
}: FieldVisibilityManagerProps) {
  const [open, setOpen] = useState(false);
  const [localVisibleFields, setLocalVisibleFields] = useState<string[]>(
    currentView?.visible_field_ids || []
  );

  // If current view doesn't have visible_field_ids set, default to all fields visible
  const visibleFieldIds = currentView?.visible_field_ids?.length ? 
    currentView.visible_field_ids : 
    fields.map(f => f.id);

  const handleFieldToggle = (fieldId: string, visible: boolean) => {
    const newVisibleFields = visible 
      ? [...localVisibleFields, fieldId]
      : localVisibleFields.filter(id => id !== fieldId);
    
    setLocalVisibleFields(newVisibleFields);
  };

  const handleSave = () => {
    onVisibilityUpdate(localVisibleFields);
    setOpen(false);
  };

  const handleSelectAll = () => {
    const allFieldIds = fields.map(f => f.id);
    setLocalVisibleFields(allFieldIds);
  };

  const handleSelectNone = () => {
    setLocalVisibleFields([]);
  };

  const visibleCount = visibleFieldIds.length;
  const totalCount = fields.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Fields ({visibleCount}/{totalCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Field Visibility</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Choose which fields to show in this view. Hidden fields won't appear in the table but can be toggled back on anytime.
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1"
            >
              Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              className="flex-1"
            >
              Hide All
            </Button>
          </div>

          <Separator />

          <ScrollArea className="h-60">
            <div className="space-y-3">
              {fields.map((field) => {
                const isVisible = localVisibleFields.includes(field.id);
                return (
                  <div key={field.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={field.id}
                      checked={isVisible}
                      onCheckedChange={(checked) => 
                        handleFieldToggle(field.id, !!checked)
                      }
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {isVisible ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Label
                        htmlFor={field.id}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {field.name}
                      </Label>
                      <div className="text-xs text-muted-foreground capitalize">
                        {field.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
