
import React, { useState } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Block } from '@/types/block';
import { Link, Search } from 'lucide-react';
import { RelationPageList } from './RelationPageList';
import { useDatabaseSearch } from '@/hooks/useDatabaseSearch';
import { DatabaseField, RelationFieldSettings } from '@/types/database';

interface RelationSelectorDialogContentProps {
  field: DatabaseField;
  loadingRelations: boolean;
  relatedPageIds: string[];
  handlePageSelect: (pageId: string) => void;
  isMultiple: boolean;
  selectedPageCount: number;
}

export function RelationSelectorDialogContent({
  field,
  loadingRelations,
  relatedPageIds,
  handlePageSelect,
  isMultiple,
  selectedPageCount,
}: RelationSelectorDialogContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const settings = field.settings as RelationFieldSettings;
  
  const { 
    pages, 
    loading: loadingSearch, 
    error: searchError 
  } = useDatabaseSearch({
    databaseId: settings?.target_database_id || '',
    searchTerm,
    enabled: !!settings?.target_database_id
  });

  const isPageSelected = (pageId: string) => relatedPageIds.includes(pageId);

  const isLoading = loadingRelations || loadingSearch;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Link className="h-4 w-4" />
          Select Related Items
        </DialogTitle>
      </DialogHeader>
      
      <div className="flex-1 space-y-4 overflow-hidden">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search-relation">Search items</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-relation"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Selection mode indicator */}
        <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          {isMultiple ? 'Multi-select: Click to toggle selection' : 'Single-select: Click to select'}
        </div>

        {/* Error display */}
        {searchError && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
            Error: {searchError}
          </div>
        )}

        {/* Page list */}
        <RelationPageList
          filteredPages={pages}
          loading={isLoading}
          searchTerm={searchTerm}
          isPageSelected={isPageSelected}
          onPageSelect={handlePageSelect}
          isMultiple={isMultiple}
        />
      </div>

      {/* Footer with selection count */}
      {isMultiple && selectedPageCount > 0 && (
        <div className="border-t pt-3 text-sm text-muted-foreground">
          {selectedPageCount} item{selectedPageCount === 1 ? '' : 's'} selected
        </div>
      )}
    </>
  );
}
