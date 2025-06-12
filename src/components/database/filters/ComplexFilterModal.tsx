
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterGroup } from '@/types/filters';
import { DatabaseField } from '@/types/database';
import { FilterGroupEditor } from './FilterGroupEditor';
import { createEmptyFilterGroup } from '@/utils/filterUtils';

interface ComplexFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  onFilterGroupChange: (group: FilterGroup) => void;
}

export function ComplexFilterModal({
  open,
  onOpenChange,
  fields,
  filterGroup,
  onFilterGroupChange,
}: ComplexFilterModalProps) {
  const clearAllFilters = () => {
    onFilterGroupChange(createEmptyFilterGroup());
  };

  const totalFilters = countFilters(filterGroup);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Advanced Filter Builder
            {totalFilters > 0 && (
              <Badge variant="secondary">{totalFilters} filter{totalFilters !== 1 ? 's' : ''}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {totalFilters > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Build complex filter logic using AND/OR operators and nested groups
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}

          <FilterGroupEditor
            group={filterGroup}
            fields={fields}
            onUpdate={onFilterGroupChange}
          />

          {totalFilters === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No filters applied</p>
              <p className="text-sm mt-1">Click "Add Rule" to create your first filter</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function countFilters(group: FilterGroup): number {
  return group.rules.length + group.groups.reduce((count, subGroup) => count + countFilters(subGroup), 0);
}
