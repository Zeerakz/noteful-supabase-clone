
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Settings, Grid3X3, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { GalleryCardSize, GalleryViewSettings } from './types';

interface GalleryViewHeaderProps {
  settings: GalleryViewSettings;
  fields: DatabaseField[];
  selectedCount: number;
  totalCount: number;
  onSettingsChange: (settings: Partial<GalleryViewSettings>) => void;
  onCreateEntry: () => void;
  onBulkDelete?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export function GalleryViewHeader({
  settings,
  fields,
  selectedCount,
  totalCount,
  onSettingsChange,
  onCreateEntry,
  onBulkDelete,
  onSelectAll,
  onClearSelection,
}: GalleryViewHeaderProps) {
  const mediaFields = fields.filter(field => 
    field.type === 'file_attachment' || field.type === 'image'
  );

  const handlePropertyVisibilityChange = (fieldId: string, visible: boolean) => {
    const newVisibleProperties = visible
      ? [...settings.visibleProperties, fieldId]
      : settings.visibleProperties.filter(id => id !== fieldId);
    
    onSettingsChange({ visibleProperties: newVisibleProperties });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium">
          Gallery ({totalCount})
          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {selectedCount} selected
            </span>
          )}
        </h3>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={onBulkDelete}
            >
              Delete Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearSelection}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {totalCount > 0 && selectedCount === 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSelectAll}
          >
            Select All
          </Button>
        )}

        {/* Gallery Settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              View Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Card Size</Label>
                <Select
                  value={settings.cardSize}
                  onValueChange={(value: GalleryCardSize) => 
                    onSettingsChange({ cardSize: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Cover Field</Label>
                <Select
                  value={settings.coverFieldId || 'none'}
                  onValueChange={(value) => 
                    onSettingsChange({ 
                      coverFieldId: value === 'none' ? null : value 
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No cover</SelectItem>
                    {mediaFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Layout</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    variant={settings.layout === 'grid' ? 'default' : 'outline'}
                    onClick={() => onSettingsChange({ layout: 'grid' })}
                    className="gap-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Grid
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.layout === 'masonry' ? 'default' : 'outline'}
                    onClick={() => onSettingsChange({ layout: 'masonry' })}
                    className="gap-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Masonry
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Visible Properties</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {fields
                    .filter(field => !['image', 'file_attachment'].includes(field.type))
                    .map((field) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={field.id}
                          checked={settings.visibleProperties.includes(field.id)}
                          onCheckedChange={(checked) =>
                            handlePropertyVisibilityChange(field.id, !!checked)
                          }
                        />
                        <Label
                          htmlFor={field.id}
                          className="text-sm font-normal"
                        >
                          {field.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button size="sm" className="gap-2" onClick={onCreateEntry}>
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>
    </div>
  );
}
