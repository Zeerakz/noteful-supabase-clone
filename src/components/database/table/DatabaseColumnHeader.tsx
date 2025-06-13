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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowUp, 
  ArrowDown, 
  Info, 
  GripVertical,
  Settings,
  ChevronDown,
  Filter,
  EyeOff,
  SortAsc,
  SortDesc
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
  onStartResize?: (fieldId: string) => void;
  onEndResize?: () => void;
  className?: string;
  width?: number;
  isResizable?: boolean;
  isDraggable?: boolean;
  isResizing?: boolean;
}

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
  onStartResize,
  onEndResize,
  className = '',
  width,
  isResizable = true,
  isDraggable = true,
  isResizing = false
}: DatabaseColumnHeaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState<'before' | 'after' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    
    const startX = e.clientX;
    const startWidth = width || 200;

    if (onStartResize) {
      onStartResize(field.id);
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(120, Math.min(600, startWidth + deltaX));
      onResize(field.id, newWidth);
    };

    const handleMouseUp = () => {
      if (onEndResize) {
        onEndResize();
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable || !onFieldReorder) return;
    
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', field.id);
    e.dataTransfer.effectAllowed = 'move';
    
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

  const canDrag = isDraggable && !!onFieldReorder;

  return (
    <TooltipProvider>
      <div 
        className={`
          relative flex items-center group h-full w-full transition-all duration-300 ease-out
          ${isDragging ? 'opacity-50' : ''}
          ${dragOver === 'before' ? 'border-l-4 border-l-primary shadow-[inset_4px_0_0_hsl(var(--primary))]' : ''}
          ${dragOver === 'after' ? 'border-r-4 border-r-primary shadow-[inset_-4px_0_0_hsl(var(--primary))]' : ''}
          ${isHovered || isDropdownOpen ? 'brightness-[1.02] bg-accent/10' : ''}
          ${className}
        `}
        draggable={canDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header Content */}
        <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
          {/* Drag Handle */}
          {canDrag && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0 p-0.5 rounded-md transition-all duration-300 ease-out hover:bg-muted/60 hover:shadow-[0_0_6px_hsl(var(--primary)/0.1)] opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-3 w-3 text-muted-foreground/60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Drag to reorder</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Main Header Content with Dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`
                  flex items-center gap-2 px-2 py-1 h-auto text-column-header hover:bg-transparent 
                  hover:text-foreground flex-1 justify-start min-w-0 transition-all duration-200 ease-out 
                  focus-visible:ring-0 focus-visible:shadow-[0_0_8px_hsl(var(--primary)/0.15)]
                  ${isHovered || isDropdownOpen ? 'text-foreground shadow-sm' : ''}
                  group/header
                `}
              >
                {/* Column Title */}
                <span className={`
                  truncate transition-all duration-200 ease-out
                  ${isHovered || isDropdownOpen ? 'font-semibold tracking-wide' : ''}
                `}>
                  {field.name.toUpperCase()}
                </span>
                
                {/* Sort Indicator */}
                {sortDirection && (
                  <div className="flex-shrink-0 ml-1">
                    {sortDirection === 'asc' ? (
                      <ArrowUp className="h-3 w-3 text-primary drop-shadow-sm" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-primary drop-shadow-sm" />
                    )}
                  </div>
                )}

                {/* Chevron - Subtle reveal on hover */}
                <ChevronDown className={`
                  h-3 w-3 flex-shrink-0 ml-auto text-muted-foreground/40 transition-all duration-200 ease-out
                  ${isHovered || isDropdownOpen 
                    ? 'opacity-100 text-muted-foreground rotate-0' 
                    : 'opacity-0 -rotate-90'
                  }
                  ${isDropdownOpen ? 'rotate-180' : ''}
                `} />
              </Button>
            </DropdownMenuTrigger>

            {/* Carefully crafted dropdown menu */}
            <DropdownMenuContent 
              align="start" 
              side="bottom"
              className={`
                w-52 bg-popover/95 backdrop-blur-sm border border-border/20 
                shadow-xl rounded-lg p-1 animate-in fade-in-0 zoom-in-95 
                data-[state=open]:animate-in data-[state=closed]:animate-out 
                data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
                data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                data-[side=bottom]:slide-in-from-top-2
              `}
              sideOffset={4}
            >
              {/* Sort Options */}
              <DropdownMenuItem 
                onClick={() => onSort(field.id, 'asc')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 hover:bg-accent/50 cursor-pointer"
              >
                <SortAsc className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sort Ascending</span>
                {sortDirection === 'asc' && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                )}
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => onSort(field.id, 'desc')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 hover:bg-accent/50 cursor-pointer"
              >
                <SortDesc className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sort Descending</span>
                {sortDirection === 'desc' && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-border/30" />

              {/* Filter Option */}
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 hover:bg-accent/50 cursor-pointer">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-border/30" />

              {/* Hide Column */}
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 hover:bg-accent/50 cursor-pointer text-muted-foreground hover:text-foreground">
                <EyeOff className="h-4 w-4" />
                <span className="text-sm font-medium">Hide Column</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Info Icon for fields with descriptions */}
          {hasDescription && (
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 flex-shrink-0 hover:bg-primary/10 hover:shadow-[0_0_6px_hsl(var(--primary)/0.1)] focus-visible:ring-0 focus-visible:shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
                >
                  <Info className="h-3 w-3 text-muted-foreground/60 hover:text-primary transition-colors duration-200" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-4" side="bottom" align="start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
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
              className="h-5 w-5 p-0 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 flex-shrink-0 hover:bg-primary/10 hover:shadow-[0_0_6px_hsl(var(--primary)/0.1)] focus-visible:ring-0 focus-visible:shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
            >
              <Settings className="h-3 w-3 text-muted-foreground/60 hover:text-primary transition-colors duration-200" />
            </Button>
          </InlinePropertyEditor>
        </div>

        {/* Resize Handle */}
        {isResizable && onResize && (
          <div
            className={`
              absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 transition-all duration-300 ease-out
              opacity-0 group-hover:opacity-100 hover:shadow-[0_0_4px_hsl(var(--primary)/0.1)] flex items-center justify-center
              ${isResizing ? 'opacity-100 shadow-[0_0_8px_hsl(var(--primary)/0.2)]' : ''}
            `}
            onMouseDown={handleResizeStart}
            title="Drag to resize column"
          >
            <div className="w-0.5 h-4 bg-muted-foreground/50 rounded-full transition-all duration-200 hover:bg-primary/60" />
          </div>
        )}

        {/* Active resize indicator */}
        {isResizing && (
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_4px_hsl(var(--primary)/0.4)] z-20 animate-pulse" />
        )}
      </div>
    </TooltipProvider>
  );
}
