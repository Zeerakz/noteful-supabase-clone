
import React, { useState } from 'react';
import { DatabaseField } from '@/types/database';
import { FieldDisplay } from './FieldDisplay';
import { Badge } from '@/components/ui/badge';
import { SystemBadge } from '@/components/ui/system-badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Pin, PinOff, Settings } from 'lucide-react';
import { isSystemProperty } from '@/types/systemProperties';
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
  pageData?: any;
  userProfiles?: any[];
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
  pageData,
  userProfiles,
  onValueChange,
  isHidden = false,
  isPinned = false,
  onToggleHidden,
  onTogglePinned,
  onFieldSettings,
  showFieldControls = false
}: EnhancedFieldDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isSystem = isSystemProperty(field.type);

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
          pageData={pageData}
          userProfiles={userProfiles}
          onValueChange={onValueChange}
        />
      </div>

      {/* Field Type Badge and System Badge */}
      {showFieldControls && (
        <div className="absolute -top-1 -right-1 flex items-center gap-1">
          <Badge variant="secondary" className="text-[10px] px-1 py-0">
            {field.type}
          </Badge>
          {isSystem && <SystemBadge size="sm" />}
        </div>
      )}

      {/* Field Controls */}
      {showFieldControls && isHovered && !isSystem && (
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

      {/* System Field Notice for System Properties */}
      {isSystem && showFieldControls && isHovered && (
        <div className="absolute top-0 right-0 bg-popover border border-border rounded-md shadow-sm p-2 text-xs text-muted-foreground max-w-48">
          This is a system property and cannot be edited. It's automatically managed by the application.
        </div>
      )}
    </div>
  );
}
