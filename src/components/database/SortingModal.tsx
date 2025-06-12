
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { DatabaseField } from '@/types/database';

export interface SortRule {
  fieldId: string;
  direction: 'asc' | 'desc';
}

interface SortingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: DatabaseField[];
  sortRules: SortRule[];
  onSortRulesChange: (rules: SortRule[]) => void;
}

export function SortingModal({ 
  open, 
  onOpenChange, 
  fields, 
  sortRules, 
  onSortRulesChange 
}: SortingModalProps) {
  const addSortRule = (fieldId: string, direction: 'asc' | 'desc') => {
    // Remove existing rule for this field if any
    const filteredRules = sortRules.filter(rule => rule.fieldId !== fieldId);
    onSortRulesChange([...filteredRules, { fieldId, direction }]);
  };

  const removeSortRule = (fieldId: string) => {
    onSortRulesChange(sortRules.filter(rule => rule.fieldId !== fieldId));
  };

  const clearAllSorts = () => {
    onSortRulesChange([]);
  };

  const getFieldName = (fieldId: string) => {
    return fields.find(f => f.id === fieldId)?.name || 'Unknown Field';
  };

  const getSortIcon = (direction: 'asc' | 'desc') => {
    return direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const availableFields = fields.filter(field => 
    !sortRules.some(rule => rule.fieldId === field.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sort Database</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Active Sort Rules */}
          {sortRules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Active Sorts</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllSorts}
                  className="text-muted-foreground hover:text-foreground h-auto p-1"
                >
                  Clear all
                </Button>
              </div>
              <div className="space-y-2">
                {sortRules.map((rule) => (
                  <div key={rule.fieldId} className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                      <span className="font-medium">{getFieldName(rule.fieldId)}</span>
                      {getSortIcon(rule.direction)}
                      <span className="text-muted-foreground">
                        {rule.direction === 'asc' ? 'Ascending' : 'Descending'}
                      </span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSortRule(rule.fieldId)}
                      className="h-auto p-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Sort */}
          {availableFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Add Sort</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <p className="text-sm font-medium">{field.name}</p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSortRule(field.id, 'asc')}
                        className="flex-1 gap-1"
                      >
                        <ArrowUp className="h-3 w-3" />
                        Asc
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSortRule(field.id, 'desc')}
                        className="flex-1 gap-1"
                      >
                        <ArrowDown className="h-3 w-3" />
                        Desc
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sortRules.length === 0 && (
            <div className="text-center py-6">
              <ArrowUpDown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No sorting applied. Select a field to sort by.
              </p>
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
