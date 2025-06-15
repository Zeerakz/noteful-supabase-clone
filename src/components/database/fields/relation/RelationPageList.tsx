
import React from 'react';
import { Block } from '@/types/block';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ExternalLink } from 'lucide-react';

interface RelationPageListProps {
  filteredPages: Block[];
  loading: boolean;
  searchTerm: string;
  isPageSelected: (pageId: string) => boolean;
  onPageSelect: (pageId: string) => void;
  isMultiple: boolean;
}

const getDisplayText = (page: Block) => {
  return (page.properties as any)?.title || 'Untitled';
};

export function RelationPageList({
  filteredPages,
  loading,
  searchTerm,
  isPageSelected,
  onPageSelect,
  isMultiple,
}: RelationPageListProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
        Loading items...
      </div>
    );
  }

  if (filteredPages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchTerm ? (
          <>
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No items found for "{searchTerm}"
          </>
        ) : (
          <>
            <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No items available
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 max-h-80">
      {filteredPages.map((page) => {
        const isSelected = isPageSelected(page.id);
        return (
          <div
            key={page.id}
            className={`p-3 rounded-md cursor-pointer transition-all border ${
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-muted border-transparent hover:border-muted-foreground/20'
            }`}
            onClick={() => onPageSelect(page.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{getDisplayText(page)}</div>
                <div className="text-xs opacity-70 truncate">
                  Created {new Date(page.created_time).toLocaleDateString()}
                </div>
              </div>
              {isSelected && (
                <div className="ml-2 flex-shrink-0">
                  {isMultiple ? (
                    <Checkbox checked={true} className="border-current" />
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full" />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
