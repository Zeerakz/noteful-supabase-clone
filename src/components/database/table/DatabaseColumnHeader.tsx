
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
  GripVertical
} from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';

interface DatabaseColumnHeaderProps {
  field: DatabaseField;
  sortRules: SortRule[];
  onSort: (fieldId: string, direction: 'asc' | 'desc') => void;
  onResize?: (fieldId: string, width: number) => void;
  className?: string;
  width?: number;
  isResizable?: boolean;
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
};

const fieldDescriptions = {
  'Partner Name': 'The name of the partner organization or individual involved in this campaign',
  'Event Type': 'The category or type of marketing event (e.g., Webinar, Conference, Workshop)',
  'Platform': 'The platform or channel where the campaign will be executed',
  'Status': 'Current status of the campaign (Planning, Active, Completed, etc.)',
  'Due Date': 'The deadline for campaign completion or deliverables',
  'End Date': 'The final date when the campaign or event concludes',
  'Notes': 'Additional notes, comments, or important details about the campaign',
  'Team Members': 'People assigned to work on this campaign',
  'Results': 'Outcomes, metrics, or results achieved from the campaign',
};

export function DatabaseColumnHeader({
  field,
  sortRules,
  onSort,
  onResize,
  className = '',
  width,
  isResizable = true
}: DatabaseColumnHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const FieldIcon = fieldTypeIcons[field.type as keyof typeof fieldTypeIcons] || Type;
  
  const currentSort = sortRules.find(rule => rule.field_id === field.id);
  const sortDirection = currentSort?.direction;
  
  const hasDescription = field.name in fieldDescriptions;

  const handleSortClick = () => {
    if (sortDirection === 'asc') {
      onSort(field.id, 'desc');
    } else if (sortDirection === 'desc') {
      // Remove sort (cycle back to no sort)
      onSort(field.id, 'asc'); // This would need to be handled in parent to remove
    } else {
      onSort(field.id, 'asc');
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isResizable || !onResize) return;
    
    e.preventDefault();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartWidth(width || 150);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartX;
      const newWidth = Math.max(100, resizeStartWidth + deltaX); // Minimum width of 100px
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

  return (
    <TooltipProvider>
      <div 
        className={`relative flex items-center justify-between group border-b border-border bg-muted/30 ${className}`}
        style={{ width: width ? `${width}px` : undefined }}
      >
        {/* Header Content */}
        <div className="flex items-center gap-2 px-3 py-2 flex-1 min-w-0">
          {/* Field Type Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-shrink-0">
                <FieldIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">{field.type.replace('_', ' ')} field</p>
            </TooltipContent>
          </Tooltip>

          {/* Column Title */}
          <Button
            variant="ghost"
            onClick={handleSortClick}
            className="flex items-center gap-2 px-0 py-0 h-auto font-medium text-sm text-foreground hover:bg-transparent flex-1 justify-start min-w-0"
          >
            <span className="truncate">{field.name}</span>
            
            {/* Sort Indicator */}
            {sortDirection && (
              <div className="flex-shrink-0">
                {sortDirection === 'asc' ? (
                  <ArrowUp className="h-3 w-3 text-primary" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-primary" />
                )}
              </div>
            )}
          </Button>

          {/* Info Icon for fields with descriptions */}
          {hasDescription && (
            <HoverCard openDelay={300}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80" side="bottom" align="start">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{field.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {fieldDescriptions[field.name as keyof typeof fieldDescriptions]}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
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
        </div>

        {/* Resize Handle */}
        {isResizable && onResize && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 flex items-center justify-center"
            onMouseDown={handleResizeStart}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        )}

        {/* Resize indicator during resizing */}
        {isResizing && (
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary" />
        )}
      </div>
    </TooltipProvider>
  );
}
