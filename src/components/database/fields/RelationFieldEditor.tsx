
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RelationFieldSettings } from '@/types/database';
import { useDatabasePages } from '@/hooks/useDatabasePages';
import { Page } from '@/types/page';
import { Plus, X, Search } from 'lucide-react';

interface RelationFieldEditorProps {
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  settings: RelationFieldSettings;
  workspaceId: string;
  isMultiple?: boolean;
}

export function RelationFieldEditor({ value, onChange, settings, workspaceId, isMultiple = false }: RelationFieldEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPages, setSelectedPages] = useState<Page[]>([]);

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
      onChange(pageId);
      setIsOpen(false);
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

  const getDisplayText = (page: Page) => {
    // For now, just use the page title
    // In a full implementation, you would use the display_property setting
    return page.title;
  };

  const isPageSelected = (pageId: string) => {
    if (!value) return false;
    const valueArray = Array.isArray(value) ? value : [value];
    return valueArray.includes(pageId);
  };

  return (
    <div className="space-y-2">
      {/* Display selected items */}
      <div className="flex flex-wrap gap-2">
        {selectedPages.map((page) => (
          <Badge key={page.id} variant="secondary" className="gap-1">
            {getDisplayText(page)}
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

      {/* Add/Select button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {selectedPages.length === 0 ? 'Select' : isMultiple ? 'Add more' : 'Change'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Related Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Page list */}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : filteredPages.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {searchTerm ? 'No entries found' : 'No entries available'}
                </div>
              ) : (
                filteredPages.map((page) => (
                  <div
                    key={page.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      isPageSelected(page.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handlePageSelect(page.id)}
                  >
                    <div className="font-medium">{getDisplayText(page)}</div>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(page.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
