
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Type, Heading1, Heading2, Heading3, List, ListOrdered, Image, Table, Minus, Quote, MessageSquare, ChevronRight, Globe, Paperclip, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface BlockCreationDropdownProps {
  onCommand: (command: string) => void;
}

export function BlockCreationDropdown({ onCommand }: BlockCreationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [adjustedSide, setAdjustedSide] = useState<'top' | 'bottom'>('bottom');

  // Smart positioning logic
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const triggerElement = triggerRef.current;
    const triggerRect = triggerElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Dropdown dimensions (approximate)
    const dropdownHeight = 16 * 32; // 16 items * ~32px per item
    const padding = 16;
    const estimatedDropdownHeight = dropdownHeight + padding * 2;

    // Calculate available space
    const spaceBelow = viewport.height - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Determine best positioning
    if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
      // Not enough space below and more space above - flip to top
      setAdjustedSide('top');
    } else {
      // Default to bottom
      setAdjustedSide('bottom');
    }
  }, [isOpen]);

  return (
    <div className="flex justify-start pt-4" ref={dropdownRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            ref={triggerRef}
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-muted-foreground border-dashed hover:border-solid hover:text-foreground transition-colors"
            data-cy="add-block-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          side={adjustedSide}
          className="w-56 max-h-[400px] overflow-y-auto"
          sideOffset={4}
        >
          <DropdownMenuItem onClick={() => onCommand('text')} data-cy="text-block-option">
            <Type className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Text</span>
              <span className="text-xs text-muted-foreground">Start writing with plain text</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('heading1')}>
            <Heading1 className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Heading 1</span>
              <span className="text-xs text-muted-foreground">Big section heading</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('heading2')}>
            <Heading2 className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Heading 2</span>
              <span className="text-xs text-muted-foreground">Medium section heading</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('heading3')}>
            <Heading3 className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Heading 3</span>
              <span className="text-xs text-muted-foreground">Small section heading</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('bullet_list')}>
            <List className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Bullet List</span>
              <span className="text-xs text-muted-foreground">Create a bulleted list</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('numbered_list')}>
            <ListOrdered className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Numbered List</span>
              <span className="text-xs text-muted-foreground">Create a numbered list</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('quote')}>
            <Quote className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Quote</span>
              <span className="text-xs text-muted-foreground">Capture a quote</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('callout')}>
            <MessageSquare className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Callout</span>
              <span className="text-xs text-muted-foreground">Make writing stand out</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('toggle')}>
            <ChevronRight className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Toggle</span>
              <span className="text-xs text-muted-foreground">Create collapsible content</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('image')}>
            <Image className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Image</span>
              <span className="text-xs text-muted-foreground">Upload or embed an image</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('two_column')}>
            <Columns className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Columns</span>
              <span className="text-xs text-muted-foreground">Create a two-column layout</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('table')}>
            <Table className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Table</span>
              <span className="text-xs text-muted-foreground">Create a simple table</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('divider')}>
            <Minus className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Divider</span>
              <span className="text-xs text-muted-foreground">Visually divide sections</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('file_attachment')}>
            <Paperclip className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">File</span>
              <span className="text-xs text-muted-foreground">Attach a file</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand('embed')}>
            <Globe className="h-4 w-4 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Embed</span>
              <span className="text-xs text-muted-foreground">Embed content from the web</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
