
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  GripVertical,
  Copy,
  Trash2,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Link,
  Mail,
  Phone,
  Tag,
  Tags,
  File,
  Image as ImageIcon,
  Calculator,
  Database,
  TrendingUp
} from 'lucide-react';
import { DatabaseField } from '@/types/database';

interface PropertyListItemProps {
  field: DatabaseField;
  index: number;
  isEditing: boolean;
  editingField: DatabaseField | null;
  isDragOver: boolean;
  onDragStart: (field: DatabaseField) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
  onDragEnd: () => void;
  onEditStart: (field: DatabaseField) => void;
  onEditChange: (field: DatabaseField) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDuplicate: (field: DatabaseField) => void;
  onDelete: (fieldId: string) => void;
}

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  datetime: Calendar,
  checkbox: CheckSquare,
  url: Link,
  email: Mail,
  phone: Phone,
  select: Tag,
  multi_select: Tags,
  file_attachment: File,
  image: ImageIcon,
  formula: Calculator,
  relation: Database,
  rollup: TrendingUp,
};

export function PropertyListItem({
  field,
  index,
  isEditing,
  editingField,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onEditStart,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDuplicate,
  onDelete
}: PropertyListItemProps) {
  const getFieldIcon = (type: string) => {
    const IconComponent = fieldTypeIcons[type as keyof typeof fieldTypeIcons] || Type;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div
      className={`
        group flex items-center gap-3 p-3 rounded-lg border
        ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
        ${isEditing ? 'ring-2 ring-primary' : ''}
      `}
      draggable
      onDragStart={() => onDragStart(field)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Field Icon */}
      <div className="flex-shrink-0">
        {getFieldIcon(field.type)}
      </div>
      
      {/* Field Info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editingField?.name || ''}
            onChange={(e) => editingField && onEditChange({ ...editingField, name: e.target.value })}
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
          />
        ) : (
          <div>
            <div className="font-medium text-sm">{field.name}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {field.type.replace('_', ' ')}
            </div>
          </div>
        )}
      </div>
      
      {/* Type Badge */}
      <Badge variant="secondary" className="text-xs">
        {field.type.replace('_', ' ')}
      </Badge>
      
      {/* Actions */}
      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <Button size="sm" variant="ghost" onClick={onSaveEdit}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditStart(field)}>
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(field)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(field.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
