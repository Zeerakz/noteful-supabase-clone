
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  FileText, 
  Image, 
  Calendar,
  MoreHorizontal
} from 'lucide-react';

interface DatabasePrimaryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasActiveFilters: boolean;
  hasActiveSorts: boolean;
  onFilterClick: () => void;
  onSortClick: () => void;
  onNewRecord: () => void;
  onNewTemplate?: () => void;
  onImportData?: () => void;
}

export function DatabasePrimaryToolbar({
  searchQuery,
  onSearchChange,
  hasActiveFilters,
  hasActiveSorts,
  onFilterClick,
  onSortClick,
  onNewRecord,
  onNewTemplate,
  onImportData,
}: DatabasePrimaryToolbarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* New Button with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={onNewRecord} className="gap-2">
              <FileText className="h-4 w-4" />
              New Record
              <kbd className="ml-auto text-xs text-muted-foreground">⌘N</kbd>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onNewTemplate && (
              <DropdownMenuItem onClick={onNewTemplate} className="gap-2">
                <Image className="h-4 w-4" />
                Create Template
              </DropdownMenuItem>
            )}
            {onImportData && (
              <>
                <DropdownMenuItem onClick={onImportData} className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Import Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                  More options...
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`pl-10 transition-all duration-200 ${
              isSearchFocused ? 'ring-2 ring-ring ring-offset-2' : ''
            }`}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            >
              ×
            </Button>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Filter Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterClick}
              className={`gap-2 transition-colors ${
                hasActiveFilters 
                  ? 'border-primary/50 bg-primary/5 text-primary hover:bg-primary/10' 
                  : 'hover:bg-muted'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasActiveFilters ? 'Filters active' : 'Add filters'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Sort Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onSortClick}
              className={`gap-2 transition-colors ${
                hasActiveSorts 
                  ? 'border-primary/50 bg-primary/5 text-primary hover:bg-primary/10' 
                  : 'hover:bg-muted'
              }`}
            >
              <SortAsc className="h-4 w-4" />
              Sort
              {hasActiveSorts && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasActiveSorts ? 'Custom sorting applied' : 'Add sorting'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Active Filters/Sorts Summary */}
        {(hasActiveFilters || hasActiveSorts) && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  Filtered
                </Badge>
              )}
              {hasActiveSorts && (
                <Badge variant="secondary" className="text-xs">
                  Sorted
                </Badge>
              )}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
