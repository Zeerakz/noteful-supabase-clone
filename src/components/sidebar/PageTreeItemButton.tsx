
import React from 'react';
import { FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageTreeItemButtonProps {
  title: string;
  isActive: boolean;
  isFocused: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  level: number;
  onNavigate: () => void;
  onToggle: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  dragHandleProps: any;
}

export function PageTreeItemButton({
  title,
  isActive,
  isFocused,
  hasChildren,
  isExpanded,
  level,
  onNavigate,
  onToggle,
  onKeyDown,
  dragHandleProps,
}: PageTreeItemButtonProps) {
  return (
    <SidebarMenuButton
      onClick={onNavigate}
      onKeyDown={onKeyDown}
      className={cn(
        "w-full justify-start text-left pr-8",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      tabIndex={isFocused ? 0 : -1}
    >
      <div {...dragHandleProps} className="flex items-center gap-1 min-w-0 flex-1">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-4 w-4 p-0 hover:bg-transparent"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-4" />
        )}
        <FileText className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{title}</span>
      </div>
    </SidebarMenuButton>
  );
}
