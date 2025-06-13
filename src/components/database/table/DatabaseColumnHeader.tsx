
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ArrowUp, 
  ArrowDown, 
  Info, 
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
  GripVertical,
  Users,
  Settings
} from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { InlinePropertyEditor } from '@/components/database/fields/InlinePropertyEditor';
import { useDatabaseFieldOperations } from '@/hooks/useDatabaseFieldOperations';

interface DatabaseColumnHeaderProps {
  field: DatabaseField;
  sortRules: SortRule[];
  onSort: (fieldId: string, direction: 'asc' | 'desc') => void;
  onResize?: (fieldId: string, width: number) => void;
  onFieldsChange?: () => void;
  onFieldReorder?: (draggedFieldId: string, targetFieldId: string, position: 'before' | 'after') => void;
  className?: string;
  width?: number;
  isResizable?: boolean;
  isDraggable?: boolean;
}

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
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
  rollup: Calculator,
  users: Users,
};

const fieldDescriptions = {
  'Partner Name': 'The name of the partner organization or individual involved in this campaign. This field helps track collaboration partnerships and external relationships.',
  'Event Type': 'The category or type of marketing event such as Webinar, Conference, Workshop, Trade Show, or Virtual Event. Used for event classification and reporting.',
  'Platform': 'The platform or channel where the campaign will be executed (e.g., Zoom, LinkedIn, Twitter, Email, Website). Helps with resource planning and channel optimization.',
  'Status': 'Current status of the campaign lifecycle: Planning, Active, Completed, On Hold, or Cancelled. Essential for project management and progress tracking.',
  'Due Date': 'The deadline for campaign completion or key deliverables. Critical for timeline management and ensuring timely execution of marketing initiatives.',
  'End Date': 'The final date when the campaign or event concludes. Used for scheduling follow-up activities and measuring campaign duration.',
  'Notes': 'Additional notes, comments, or important details about the campaign. Captures context, special requirements, lessons learned, or action items.',
  'Team Members': 'People assigned to work on this campaign including project managers, designers, copywriters, and coordinators. Enables proper resource allocation and accountability.',
  'Results': 'Outcomes, metrics, or results achieved from the campaign such as leads generated, attendance numbers, engagement rates, or ROI. Used for performance analysis.',
};

export function DatabaseColumnHeader({
  field,
  sortRules,
  onSort,
  onResize,
  onFieldsChange,
  onFieldReorder,
  className = '',
  width,
  isResizable = true,
  isDraggable = true
}: DatabaseColumnHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState<'before' | 'after' | null>(null);

  const FieldIcon = fieldTypeIcons[field.type as keyof typeof fieldTypeIcons] || Type;
  
  const currentSort = sortRules.find(rule => rule.fieldId === field.id);
  const sortDirection = currentSort?.direction;
  
  const hasDescription = field.name in fieldDescriptions;
  const databaseId = field.database_id;
  const fieldOperations = useDatabaseFieldOperations(databaseId, onFieldsChange);

  const handleSortClick = () => {
    if (sortDirection === 'asc') {
      onSort(field.id, 'desc');
    } else if (sortDirection === 'desc') {
      onSort(field.id, 'asc');
    } else {
      onSort(field.id, 'asc');
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isResizable || !onResize) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartWidth(width || 150);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartX;
      // Only allow extending to the right (positive deltaX)
      // Minimum width is the starting width, maximum can grow
      const newWidth = Math.max(resizeStartWidth, resizeStartWidth + deltaX);
      onResize(field.id, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable || !onFieldReorder) return;
    
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', field.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = field.name;
    dragImage.className = 'bg-background border border-border rounded-md px-3 py-2 shadow-lg text-sm font-medium';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDraggable || !onFieldReorder) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const position = e.clientX < midpoint ? 'before' : 'after';
    setDragOver(position);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDraggable || !onFieldReorder) return;
    
    e.preventDefault();
    const draggedFieldId = e.dataTransfer.getData('text/plain');
    
    if (draggedFieldId !== field.id && dragOver) {
      onFieldReorder(draggedFieldId, field.id, dragOver);
    }
    
    setDragOver(null);
  };

  return (
    <TooltipProvider>
      <div 
        className={`
          relative flex items-center justify-between group 
          border-b-2 border-border bg-background/98 backdrop-blur-md 
          hover:bg-muted/50 transition-colors 
          ${isDragging ? 'opacity-50' : ''}
          ${dragOver === 'before' ? 'border-l-4 border-l-primary' : ''}
          ${dragOver === 'after' ? 'border-r-4 border-r-primary' : ''}
          ${className}
        `}
        style={{ width: width ? `${width}px` : undefined }}
        draggable={isDraggable && !!onFieldReorder}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header Content */}
        <div className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0">
          {/* Drag Handle */}
          {isDraggable && onFieldReorder && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0 p-1 rounded-md hover:bg-muted/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Drag to reorder</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Field Type Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-shrink-0 p-1 rounded-md bg-muted/40">
                <FieldIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-medium capitalize">{field.type.replace('_', ' ')} field</p>
            </TooltipContent>
          </Tooltip>

          {/* Column Title with Sort */}
          <Button
            variant="ghost"
            onClick={handleSortClick}
            className="flex items-center gap-2 px-1 py-1 h-auto font-semibold text-sm text-foreground hover:bg-transparent hover:text-primary flex-1 justify-start min-w-0 transition-colors"
          >
            <span className="truncate tracking-tight">{field.name}</span>
            
            {/* Sort Indicator */}
            {sortDirection && (
              <div className="flex-shrink-0 ml-1">
                {sortDirection === 'asc' ? (
                  <ArrowUp className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
            )}
          </Button>

          {/* Info Icon for fields with descriptions */}
          {hasDescription && (
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 hover:bg-primary/10"
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-4" side="bottom" align="start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FieldIcon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">{field.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {fieldDescriptions[field.name as keyof typeof fieldDescriptions]}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {field.type.replace('_', ' ')}
                    </Badge>
                    {field.settings?.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}

          {/* Inline Property Editor */}
          <InlinePropertyEditor
            field={field}
            onUpdate={fieldOperations.updateField}
            onDuplicate={fieldOperations.duplicateField}
            onDelete={fieldOperations.deleteField}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 hover:bg-primary/10"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
          </InlinePropertyEditor>
        </div>

        {/* Resize Handle - Modified to show right-only resize cursor */}
        {isResizable && onResize && (
          <div
            className={`
              absolute right-0 top-0 bottom-0 w-2 cursor-e-resize 
              opacity-0 group-hover:opacity-100 transition-opacity 
              hover:bg-primary/20 flex items-center justify-center
              ${isResizing ? 'opacity-100 bg-primary/30' : ''}
            `}
            onMouseDown={handleResizeStart}
            title="Drag to extend column width"
          >
            <div className="w-0.5 h-4 bg-muted-foreground/50 rounded-full" />
          </div>
        )}

        {/* Active resize indicator */}
        {isResizing && (
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary shadow-lg" />
        )}
      </div>
    </TooltipProvider>
  );
}
