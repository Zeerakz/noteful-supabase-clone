import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Image, 
  Table, 
  Minus, 
  Quote,
  MessageSquare,
  ChevronRight,
  Copy,
  FileText,
  Globe,
  Paperclip,
  Columns
} from 'lucide-react';

interface SlashMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (type: string) => void;
  position: { top: number; left: number };
  searchTerm?: string;
}

const menuItems = [
  { 
    type: 'text', 
    label: 'Text', 
    icon: Type, 
    description: 'Just start writing with plain text',
    keywords: ['text', 'paragraph', 'p'] 
  },
  { 
    type: 'heading1', 
    label: 'Heading 1', 
    icon: Heading1, 
    description: 'Big section heading',
    keywords: ['heading1', 'h1', 'title', 'large'] 
  },
  { 
    type: 'heading2', 
    label: 'Heading 2', 
    icon: Heading2, 
    description: 'Medium section heading',
    keywords: ['heading2', 'h2', 'subtitle', 'medium'] 
  },
  { 
    type: 'heading3', 
    label: 'Heading 3', 
    icon: Heading3, 
    description: 'Small section heading',
    keywords: ['heading3', 'h3', 'subheading', 'small'] 
  },
  { 
    type: 'bullet_list', 
    label: 'Bulleted list', 
    icon: List, 
    description: 'Create a simple bulleted list',
    keywords: ['bullet', 'list', 'ul', 'bullets', 'items'] 
  },
  { 
    type: 'numbered_list', 
    label: 'Numbered list', 
    icon: ListOrdered, 
    description: 'Create a list with numbering',
    keywords: ['numbered', 'list', 'ol', 'ordered', 'numbers'] 
  },
  { 
    type: 'quote', 
    label: 'Quote', 
    icon: Quote, 
    description: 'Capture a quote',
    keywords: ['quote', 'blockquote', 'citation'] 
  },
  { 
    type: 'callout', 
    label: 'Callout', 
    icon: MessageSquare, 
    description: 'Make writing stand out',
    keywords: ['callout', 'highlight', 'note', 'info', 'warning'] 
  },
  { 
    type: 'toggle', 
    label: 'Toggle list', 
    icon: ChevronRight, 
    description: 'Toggles can hide and show content',
    keywords: ['toggle', 'collapse', 'expand', 'accordion'] 
  },
  { 
    type: 'image', 
    label: 'Image', 
    icon: Image, 
    description: 'Upload or embed with a link',
    keywords: ['image', 'picture', 'photo', 'img'] 
  },
  { 
    type: 'file_attachment', 
    label: 'File', 
    icon: Paperclip, 
    description: 'Upload and attach a file',
    keywords: ['file', 'attachment', 'upload', 'document'] 
  },
  { 
    type: 'embed', 
    label: 'Embed', 
    icon: Globe, 
    description: 'Embed YouTube, Vimeo, CodePen, Figma, or any URL',
    keywords: ['embed', 'youtube', 'vimeo', 'url', 'iframe'] 
  },
  { 
    type: 'table', 
    label: 'Table', 
    icon: Table, 
    description: 'Create a simple table',
    keywords: ['table', 'grid', 'rows', 'columns'] 
  },
  { 
    type: 'divider', 
    label: 'Divider', 
    icon: Minus, 
    description: 'Visually divide blocks',
    keywords: ['divider', 'separator', 'line', 'break'] 
  },
  { 
    type: 'two_column', 
    label: 'Columns', 
    icon: Columns, 
    description: 'Create a two-column layout',
    keywords: ['columns', 'layout', 'two', 'split'] 
  },
  { 
    type: 'duplicate_page', 
    label: 'Duplicate page', 
    icon: Copy, 
    description: 'Duplicate this page',
    keywords: ['duplicate', 'copy', 'clone'] 
  },
  { 
    type: 'from_template', 
    label: 'From template', 
    icon: FileText, 
    description: 'Create from a template',
    keywords: ['template', 'preset', 'sample'] 
  },
];

export function SlashMenu({ isOpen, onClose, onSelectItem, position, searchTerm = '' }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [maxHeight, setMaxHeight] = useState(400);
  
  // Filter items based on search term
  const filteredItems = menuItems.filter(item => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      item.label.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.keywords.some(keyword => keyword.includes(term))
    );
  });

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Smart positioning logic
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menuElement = menuRef.current;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Menu dimensions
    const menuWidth = 320;
    const itemHeight = 64; // Approximate height per item
    const padding = 16;
    const headerHeight = 40;
    const baseMenuHeight = headerHeight + padding * 2;
    const itemsHeight = filteredItems.length * itemHeight;
    const idealMenuHeight = Math.min(baseMenuHeight + itemsHeight, 400);

    // Calculate available space
    const spaceBelow = viewport.height - position.top;
    const spaceAbove = position.top;
    const spaceRight = viewport.width - position.left;

    let newTop = position.top;
    let newLeft = position.left;
    let newMaxHeight = idealMenuHeight;

    // Vertical positioning
    if (spaceBelow < idealMenuHeight && spaceAbove > spaceBelow) {
      // Flip above if there's more space above
      newTop = position.top - idealMenuHeight - 8; // 8px gap from trigger
      newMaxHeight = Math.min(idealMenuHeight, spaceAbove - 16);
    } else {
      // Keep below but adjust height if needed
      newMaxHeight = Math.min(idealMenuHeight, spaceBelow - 16);
    }

    // Horizontal positioning
    if (spaceRight < menuWidth) {
      // Not enough space on the right, position to the left
      newLeft = Math.max(8, position.left - menuWidth);
    }

    // Ensure menu doesn't go above viewport
    newTop = Math.max(8, newTop);
    
    // Ensure menu doesn't go below viewport
    if (newTop + newMaxHeight > viewport.height - 8) {
      newTop = viewport.height - newMaxHeight - 8;
    }

    setAdjustedPosition({ top: newTop, left: newLeft });
    setMaxHeight(newMaxHeight);
  }, [isOpen, position, filteredItems.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelectItem(filteredItems[selectedIndex].type);
            onClose();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, filteredItems, selectedIndex, onClose, onSelectItem]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const selectedElement = menuRef.current.children[1]?.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 50,
      }}
      ref={menuRef}
    >
      <Card 
        className="w-[320px] overflow-hidden shadow-lg border-border bg-popover"
        style={{ maxHeight }}
      >
        <div className="p-2">
          <div className="text-sm text-muted-foreground mb-2 px-2">
            {searchTerm ? `Filtering by "${searchTerm}"` : "Type '/' to insert a block"}
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No blocks found matching "{searchTerm}"
            </div>
          ) : (
            <div 
              className="overflow-y-auto"
              style={{ maxHeight: maxHeight - 60 }} // Account for header
            >
              {filteredItems.map((item, index) => (
                <Button
                  key={item.type}
                  variant="ghost"
                  className={`justify-start w-full p-3 h-auto hover:bg-secondary/80 transition-colors ${
                    index === selectedIndex ? 'bg-secondary/60' : ''
                  }`}
                  onClick={() => {
                    onSelectItem(item.type);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="flex flex-col items-start text-left min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {item.description}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
