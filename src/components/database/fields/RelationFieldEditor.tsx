
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RelationFieldSettings } from '@/types/database';
import { useDatabasePages } from '@/hooks/useDatabasePages';
import { Page } from '@/types/page';
import { Plus, X, Search, Link, ExternalLink } from 'lucide-react';

interface RelationFieldEditorProps {
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  settings: RelationFieldSettings;
  workspaceId: string;
  isMultiple?: boolean;
  showBacklink?: boolean;
  onBacklinkToggle?: (enabled: boolean) => void;
}

export function RelationFieldEditor({ 
  value, 
  onChange, 
  settings, 
  workspaceId, 
  isMultiple = false,
  showBacklink = false,
  onBacklinkToggle
}: RelationFieldEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPages, setSelectedPages] = useState<Page[]>([]);
  const [localBacklink, setLocalBacklink] = useState(showBacklink);

  const { pages, loading } = useDatabasePages(settings.target_database_id, workspaceId);

  // Initialize selected pages based on current value
  useEffect(() => {
    if (!value || !pages.length) {
      setSelectedPages([]);
      return;
    }

    const valueArray = Array.isArray(value) ? value : [value];
    const selected = pages.filter(page => valueArray.includes(page.id));
    setSelectedPages(selected);
  }, [value, pages]);

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageSelect = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    if (isMultiple) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      if (currentValues.includes(pageId)) {
        // Remove if already selected
        const newValues = currentValues.filter(id => id !== pageId);
        onChange(newValues.length > 0 ? newValues : null);
      } else {
        // Add to selection
        onChange([...currentValues, pageId]);
      }
    } else {
      // Single selection
      if (value === pageId) {
        onChange(null); // Deselect if already selected
      } else {
        onChange(pageId);
        setIsOpen(false);
      }
    }
  };

  const handleRemove = (pageId: string) => {
    if (isMultiple) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      const newValues = currentValues.filter(id => id !== pageId);
      onChange(newValues.length > 0 ? newValues : null);
    } else {
      onChange(null);
    }
  };

  const handleBacklinkToggle = (enabled: boolean) => {
    setLocalBacklink(enabled);
    if (onBacklinkToggle) {
      onBacklinkToggle(enabled);
    }
  };

  const getDisplayText = (page: Page) => {
    // Use the display_property setting if available, otherwise use title
    if (settings.display_property && settings.display_property !== 'title') {
      // In a full implementation, you would fetch the property value
      // For now, just use the title
      return page.title;
    }
    return page.title;
  };

  const isPageSelected = (pageId: string) => {
    if (!value) return false;
    const valueArray = Array.isArray(value) ? value : [value];
    return valueArray.includes(pageId);
  };

  return (
    <div className="space-y-3">
      {/* Selected items display */}
      <div className="space-y-2">
        {selectedPages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedPages.map((page) => (
              <Badge key={page.id} variant="secondary" className="gap-2 pr-1">
                <Link className="h-3 w-3" />
                <span className="max-w-32 truncate">{getDisplayText(page)}</span>
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

        {/* Empty state */}
        {selectedPages.length === 0 && (
          <div className="text-sm text-muted-foreground border border-dashed border-muted-foreground/30 rounded-md p-3 text-center">
            No items selected
          </div>
        )}
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
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Select Related Items
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 space-y-4 overflow-hidden">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search items</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
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

              {/* Page list */}
              <div className="flex-1 overflow-y-auto space-y-1 max-h-80">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    Loading items...
                  </div>
                ) : filteredPages.length === 0 ? (
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
                ) : (
                  filteredPages.map((page) => {
                    const isSelected = isPageSelected(page.id);
                    return (
                      <div
                        key={page.id}
                        className={`p-3 rounded-md cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-muted border-transparent hover:border-muted-foreground/20'
                        }`}
                        onClick={() => handlePageSelect(page.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{getDisplayText(page)}</div>
                            <div className="text-xs opacity-70 truncate">
                              Created {new Date(page.created_at).toLocaleDateString()}
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
                  })
                )}
              </div>
            </div>

            {/* Footer with selection count */}
            {isMultiple && selectedPages.length > 0 && (
              <div className="border-t pt-3 text-sm text-muted-foreground">
                {selectedPages.length} item{selectedPages.length === 1 ? '' : 's'} selected
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Backlink toggle */}
        {onBacklinkToggle && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-backlink"
              checked={localBacklink}
              onCheckedChange={handleBacklinkToggle}
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
