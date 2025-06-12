
import React, { useState } from 'react';
import { DatabaseField } from '@/types/database';
import { FieldDisplay } from './FieldDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Pin, PinOff, Settings } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedFieldDisplayProps {
  field: DatabaseField;
  value: string | null;
  pageId?: string;
  onValueChange?: (value: string) => void;
  isHidden?: boolean;
  isPinned?: boolean;
  onToggleHidden?: (fieldId: string) => void;
  onTogglePinned?: (fieldId: string) => void;
  onFieldSettings?: (fieldId: string) => void;
  showFieldControls?: boolean;
}

export function EnhancedFieldDisplay({
  field,
  value,
  pageId,
  onValueChange,
  isHidden = false,
  isPinned = false,
  onToggleHidden,
  onTogglePinned,
  onFieldSettings,
  showFieldControls = false
}: EnhancedFieldDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isHidden) {
    return null;
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`transition-all duration-200 ${isPinned ? 'ring-1 ring-primary/30 bg-primary/5' : ''}`}>
        <FieldDisplay
          field={field}
          value={value}
          pageId={pageId}
          onValueChange={onValueChange}
        />
      </div>

      {/* Field Type Badge */}
      {showFieldControls && (
        <div className="absolute -top-1 -right-1">
          <Badge variant="secondary" className="text-[10px] px-1 py-0">
            {field.type}
          </Badge>
        </div>
      )}

      {/* Field Controls */}
      {showFieldControls && isHovered && (
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-popover border border-border rounded-md shadow-sm p-1">
          <TooltipProvider>
            {/* Pin/Unpin Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onTogglePinned?.(field.id)}
                >
                  {isPinned ? (
                    <PinOff className="h-3 w-3" />
                  ) : (
                    <Pin className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isPinned ? 'Unpin field' : 'Pin field'}
              </TooltipContent>
            </Tooltip>

            {/* Hide/Show Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onToggleHidden?.(field.id)}
                >
                  {isHidden ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isHidden ? 'Show field' : 'Hide field'}
              </TooltipContent>
            </Tooltip>

            {/* Field Settings Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onFieldSettings?.(field.id)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Field settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
