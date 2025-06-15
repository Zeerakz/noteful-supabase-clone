
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Block } from '@/types/block';
import { Link, X } from 'lucide-react';

interface SelectedRelationItemsProps {
  selectedPages: Block[];
  onRemove: (pageId: string) => void;
}

const getDisplayText = (page: Block) => {
  return (page.properties as any)?.title || 'Untitled';
};

export function SelectedRelationItems({ selectedPages, onRemove }: SelectedRelationItemsProps) {
  if (selectedPages.length === 0) {
    return (
      <div className="text-sm text-muted-foreground border border-dashed border-muted-foreground/30 rounded-md p-3 text-center">
        No items selected
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedPages.map((page) => (
        <Badge key={page.id} variant="secondary" className="gap-2 pr-1">
          <Link className="h-3 w-3" />
          <span className="max-w-32 truncate">{getDisplayText(page)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onRemove(page.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
