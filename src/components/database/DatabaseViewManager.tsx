
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MoreHorizontal, Star, Copy, Trash2, Share2 } from 'lucide-react';
import { SavedDatabaseView } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { DatabaseViewType } from './DatabaseViewSelector';
import { createEmptyFilterGroup } from '@/utils/filterUtils';

interface DatabaseViewManagerProps {
  views: SavedDatabaseView[];
  currentView: SavedDatabaseView | null;
  onViewSelect: (view: SavedDatabaseView) => void;
  onCreateView: (
    name: string,
    viewType: string,
    filters?: FilterGroup,
    sorts?: SortRule[],
    groupingFieldId?: string,
    description?: string
  ) => Promise<SavedDatabaseView | null>;
  onUpdateView: (viewId: string, updates: Partial<SavedDatabaseView>) => void;
  onDeleteView: (viewId: string) => void;
  onDuplicateView: (viewId: string, newName: string) => Promise<SavedDatabaseView | null>;
  onSetDefaultView: (viewId: string) => void;
  currentFilters: FilterGroup;
  currentSorts: SortRule[];
  currentViewType: DatabaseViewType;
  groupingFieldId?: string;
}

// Helper function to count filters in a FilterGroup
const countFilters = (group: FilterGroup): number => {
  return group.rules.length + group.groups.reduce((count, subGroup) => count + countFilters(subGroup), 0);
};

export function DatabaseViewManager({
  views,
  currentView,
  onViewSelect,
  onCreateView,
  onUpdateView,
  onDeleteView,
  onDuplicateView,
  onSetDefaultView,
  currentFilters,
  currentSorts,
  currentViewType,
  groupingFieldId,
}: DatabaseViewManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');
  const [duplicateViewId, setDuplicateViewId] = useState<string | null>(null);
  const [duplicateViewName, setDuplicateViewName] = useState('');

  const handleCreateView = async () => {
    if (!newViewName.trim()) return;

    const view = await onCreateView(
      newViewName.trim(),
      currentViewType,
      currentFilters,
      currentSorts,
      groupingFieldId,
      newViewDescription.trim() || undefined
    );

    if (view) {
      setShowCreateDialog(false);
      setNewViewName('');
      setNewViewDescription('');
      onViewSelect(view);
    }
  };

  const handleDuplicateView = async () => {
    if (!duplicateViewId || !duplicateViewName.trim()) return;

    const view = await onDuplicateView(duplicateViewId, duplicateViewName.trim());
    if (view) {
      setDuplicateViewId(null);
      setDuplicateViewName('');
      onViewSelect(view);
    }
  };

  const saveCurrentAsView = async () => {
    const baseName = `${currentView?.name || 'View'} (Copy)`;
    let finalName = baseName;
    let counter = 1;

    // Find a unique name
    while (views.some(v => v.name === finalName)) {
      finalName = `${baseName} ${counter}`;
      counter++;
    }

    const view = await onCreateView(
      finalName,
      currentViewType,
      currentFilters,
      currentSorts,
      groupingFieldId
    );

    if (view) {
      onViewSelect(view);
    }
  };

  // Parse the current view's filters safely
  const parseViewFilters = (view: SavedDatabaseView): FilterGroup => {
    try {
      if (typeof view.filters === 'string') {
        const parsed = JSON.parse(view.filters);
        // Convert old array format to new FilterGroup format if needed
        if (Array.isArray(parsed)) {
          return createEmptyFilterGroup();
        }
        // Validate that parsed object has FilterGroup structure
        if (parsed && typeof parsed === 'object' && 'id' in parsed && 'operator' in parsed) {
          return parsed as FilterGroup;
        }
        return createEmptyFilterGroup();
      }
      // Handle case where filters is stored as an array (old format)
      if (Array.isArray(view.filters)) {
        return createEmptyFilterGroup();
      }
      // Handle case where filters is already a FilterGroup object
      if (view.filters && typeof view.filters === 'object' && 'id' in view.filters) {
        return view.filters as FilterGroup;
      }
      return createEmptyFilterGroup();
    } catch {
      return createEmptyFilterGroup();
    }
  };

  const parseViewSorts = (view: SavedDatabaseView): SortRule[] => {
    try {
      if (typeof view.sorts === 'string') {
        return JSON.parse(view.sorts) || [];
      }
      if (Array.isArray(view.sorts)) {
        return view.sorts as SortRule[];
      }
      return [];
    } catch {
      return [];
    }
  };

  const hasUnsavedChanges = currentView && (
    JSON.stringify(parseViewFilters(currentView)) !== JSON.stringify(currentFilters) ||
    JSON.stringify(parseViewSorts(currentView)) !== JSON.stringify(currentSorts) ||
    currentView.view_type !== currentViewType ||
    currentView.grouping_field_id !== groupingFieldId
  );

  return (
    <div className="flex items-center gap-2">
      {/* View Tabs */}
      <Tabs value={currentView?.id || 'new'} className="flex-1">
        <TabsList className="grid w-full grid-cols-auto gap-1">
          {views.map((view) => (
            <TabsTrigger
              key={view.id}
              value={view.id}
              onClick={() => onViewSelect(view)}
              className="relative"
            >
              <div className="flex items-center gap-1">
                {view.is_default && <Star className="h-3 w-3" />}
                <span>{view.name}</span>
              </div>
            </TabsTrigger>
          ))}
          
          {/* Create View Button */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New View</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="Enter view name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    value={newViewDescription}
                    onChange={(e) => setNewViewDescription(e.target.value)}
                    placeholder="Describe this view"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateView} disabled={!newViewName.trim()}>
                    Create View
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsList>
      </Tabs>

      {/* View Actions */}
      {currentView && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasUnsavedChanges && (
              <>
                <DropdownMenuItem onClick={saveCurrentAsView}>
                  <Plus className="h-4 w-4 mr-2" />
                  Save as New View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateView(currentView.id, {
                    filters: JSON.stringify(currentFilters) as any,
                    sorts: JSON.stringify(currentSorts) as any,
                    view_type: currentViewType,
                    grouping_field_id: groupingFieldId,
                  })}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Update Current View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem
              onClick={() => {
                setDuplicateViewId(currentView.id);
                setDuplicateViewName(`${currentView.name} (Copy)`);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate View
            </DropdownMenuItem>
            
            {!currentView.is_default && (
              <DropdownMenuItem onClick={() => onSetDefaultView(currentView.id)}>
                <Star className="h-4 w-4 mr-2" />
                Set as Default
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              Share View
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => onDeleteView(currentView.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Duplicate View Dialog */}
      <Dialog open={!!duplicateViewId} onOpenChange={() => setDuplicateViewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Name</label>
              <Input
                value={duplicateViewName}
                onChange={(e) => setDuplicateViewName(e.target.value)}
                placeholder="Enter new view name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDuplicateViewId(null)}>
                Cancel
              </Button>
              <Button onClick={handleDuplicateView} disabled={!duplicateViewName.trim()}>
                Duplicate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
