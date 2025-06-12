
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Images, File, Edit, Eye, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DatabaseField } from '@/types/database';
import { PageWithProperties, GalleryCardSize } from './types';
import { cn } from '@/lib/utils';

interface GalleryCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  settings: {
    cardSize: GalleryCardSize;
    coverFieldId: string | null;
    visibleProperties: string[];
  };
  signedUrl?: string;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}

export function GalleryCard({
  page,
  fields,
  settings,
  signedUrl,
  isSelected,
  onSelect,
  onEdit,
  onView,
  onDelete,
}: GalleryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getFieldName = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.name || '';
  };

  const getCardSizeClasses = () => {
    switch (settings.cardSize) {
      case 'small':
        return 'h-48';
      case 'medium':
        return 'h-64';
      case 'large':
        return 'h-80';
      default:
        return 'h-64';
    }
  };

  const getCoverContent = () => {
    if (!settings.coverFieldId) return null;

    const coverValue = page.properties[settings.coverFieldId];
    if (!coverValue) return null;

    const coverField = fields.find(f => f.id === settings.coverFieldId);
    if (!coverField) return null;

    if (coverField.type === 'image') {
      return signedUrl ? (
        <img
          src={signedUrl}
          alt={page.title}
          className="w-full h-32 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-32 bg-muted">
          <Images className="h-8 w-8 text-muted-foreground" />
        </div>
      );
    } else if (coverField.type === 'file_attachment') {
      return (
        <div className="flex items-center justify-center h-32 bg-muted">
          <div className="text-center">
            <File className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <span className="text-xs text-muted-foreground">
              {coverValue}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  const visibleProperties = settings.visibleProperties
    .map(fieldId => ({
      fieldId,
      field: fields.find(f => f.id === fieldId),
      value: page.properties[fieldId]
    }))
    .filter(prop => prop.field && prop.value);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        getCardSizeClasses(),
        isSelected && "ring-2 ring-primary",
        isHovered && "shadow-lg"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="bg-background/80 backdrop-blur-sm"
        />
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={onView}
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onEdit}
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <span className="h-4 w-4 mr-2">🗑</span>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cover Image/File */}
      {getCoverContent()}

      <CardContent className="p-3 h-full flex flex-col">
        {/* Title */}
        <h4 className="font-medium text-sm truncate mb-2" title={page.title}>
          {page.title || 'Untitled'}
        </h4>

        {/* Properties */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {visibleProperties.slice(0, settings.cardSize === 'large' ? 6 : settings.cardSize === 'medium' ? 4 : 2).map(({ fieldId, field, value }) => (
            <div key={fieldId}>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {field!.name}
              </div>
              <div className="text-sm">
                {field!.type === 'select' || field!.type === 'multi_select' ? (
                  <Badge variant="secondary" className="text-xs">
                    {value}
                  </Badge>
                ) : (
                  <div className="truncate">{value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
