
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Filter, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface MobileTableHeaderProps {
  fields: DatabaseField[];
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: (selected: boolean) => void;
}

export function MobileTableHeader({
  fields,
  sortRules,
  setSortRules,
  selectedCount,
  totalCount,
  onSelectAll
}: MobileTableHeaderProps) {
  const hasActiveSorting = sortRules.length > 0;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  const handleSort = (fieldId: string, direction: 'asc' | 'desc') => {
    setSortRules([{ fieldId, direction }]);
  };

  const clearSort = () => {
    setSortRules([]);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
      {/* Left side - Selection and count */}
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isAllSelected}
          ref={(ref) => {
            if (ref) {
              ref.indeterminate = isPartiallySelected;
            }
          }}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />
        
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 ? (
            <span>
              {selectedCount} of {totalCount} selected
            </span>
          ) : (
            <span>{totalCount} rows</span>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Sort indicator */}
        {hasActiveSorting && (
          <Badge variant="secondary" className="text-xs">
            Sorted
          </Badge>
        )}

        {/* Sort & Filter Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 motion-interactive"
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sort by
            </div>
            
            {fields.slice(0, 5).map((field) => (
              <React.Fragment key={field.id}>
                <DropdownMenuItem
                  onClick={() => handleSort(field.id, 'asc')}
                  className="text-sm"
                >
                  {field.name} (A → Z)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSort(field.id, 'desc')}
                  className="text-sm"
                >
                  {field.name} (Z → A)
                </DropdownMenuItem>
              </React.Fragment>
            ))}
            
            {hasActiveSorting && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearSort}
                  className="text-sm text-muted-foreground"
                >
                  Clear sorting
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 motion-interactive"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
