
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatabaseField, RelationFieldSettings } from '@/types/database';
import { useDatabasePages } from '@/hooks/useDatabasePages';
import { Block } from '@/types/block';
import { Plus, X, Search, Link, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RelationFieldEditorProps {
  value: string | string[] | null; // This will be ignored, but kept for compatibility
  onChange: (value: string | string[] | null) => void; // This will not be called
  settings: RelationFieldSettings;
  workspaceId: string;
  isMultiple?: boolean;
  showBacklink?: boolean;
  onBacklinkToggle?: (enabled: boolean) => void;
  pageId: string;
  field: DatabaseField;
}

export function RelationFieldEditor({ 
  value, 
  onChange, 
  settings, 
  workspaceId, 
  isMultiple = false,
  showBacklink = false,
  onBacklinkToggle,
  pageId,
  field
}: RelationFieldEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPages, setSelectedPages] = useState<Block[]>([]);
  const [relatedPageIds, setRelatedPageIds] = useState<string[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(true);
  const [localBacklink, setLocalBacklink] = useState(showBacklink);

  const { pages, loading: loadingTargetPages } = useDatabasePages(settings.target_database_id, workspaceId);

  // Fetch initial related page IDs from the new page_relations table
  useEffect(() => {
    const fetchRelations = async () => {
      if (!pageId || !field.id) return;
      setLoadingRelations(true);
      try {
        const { data, error } = await supabase
          .from('page_relations')
          .select('to_page_id')
          .eq('from_page_id', pageId)
          .eq('relation_property_id', field.id);

        if (error) throw error;
        
        setRelatedPageIds(data.map(r => r.to_page_id));
      } catch (err) {
        console.error('Error fetching relations:', err);
        setRelatedPageIds([]);
      } finally {
        setLoadingRelations(false);
      }
    };
    fetchRelations();
  }, [pageId, field.id]);

  // Update selected pages based on fetched IDs
  useEffect(() => {
    if (loadingRelations || !pages.length) {
      if (!loadingRelations) setSelectedPages([]);
      return;
    }
    const selected = pages.filter(page => relatedPageIds.includes(page.id));
    setSelectedPages(selected);
  }, [relatedPageIds, pages, loadingRelations]);

  const filteredPages = pages.filter(page =>
    ((page.properties as any)?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageSelect = async (selectedPageId: string) => {
    const page = pages.find(p => p.id === selectedPageId);
    if (!page) return;

    if (isMultiple) {
      if (relatedPageIds.includes(selectedPageId)) {
        // Remove if already selected
        const { error } = await supabase
          .from('page_relations')
          .delete()
          .match({ from_page_id: pageId, to_page_id: selectedPageId, relation_property_id: field.id });
        if (!error) {
          setRelatedPageIds(currentIds => currentIds.filter(id => id !== selectedPageId));
        }
      } else {
        // Add to selection
        const { error } = await supabase
          .from('page_relations')
          .insert({ from_page_id: pageId, to_page_id: selectedPageId, relation_property_id: field.id });
        if (!error) {
          setRelatedPageIds(currentIds => [...currentIds, selectedPageId]);
        }
      }
    } else {
      // Single selection
      if (relatedPageIds.includes(selectedPageId)) {
        // Deselect if already selected
        const { error } = await supabase
          .from('page_relations')
          .delete()
          .match({ from_page_id: pageId, to_page_id: selectedPageId, relation_property_id: field.id });
        if (!error) {
          setRelatedPageIds([]);
        }
      } else {
        // To change selection, first delete existing relations for this property, then insert the new one
        const { error: deleteError } = await supabase
          .from('page_relations')
          .delete()
          .match({ from_page_id: pageId, relation_property_id: field.id });
        
        if (!deleteError) {
          const { error: insertError } = await supabase
            .from('page_relations')
            .insert({ from_page_id: pageId, to_page_id: selectedPageId, relation_property_id: field.id });
          if (!insertError) {
            setRelatedPageIds([selectedPageId]);
          }
        }
        setIsOpen(false);
      }
    }
  };
  
  const handleRemove = async (pageIdToRemove: string) => {
    const { error } = await supabase
      .from('page_relations')
      .delete()
      .match({ from_page_id: pageId, to_page_id: pageIdToRemove, relation_property_id: field.id });
    if (!error) {
      setRelatedPageIds(currentIds => currentIds.filter(id => id !== pageIdToRemove));
    }
  };

  const handleBacklinkToggle = (enabled: boolean) => {
    setLocalBacklink(enabled);
    if (onBacklinkToggle) {
      onBacklinkToggle(enabled);
    }
  };

  const getDisplayText = (page: Block) => {
    return (page.properties as any)?.title || 'Untitled';
  };

  const isPageSelected = (pageId: string) => {
    return relatedPageIds.includes(pageId);
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
                {loadingTargetPages || loadingRelations ? (
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
              onCheckedChange={(checked) => handleBacklinkToggle(Boolean(checked))}
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
