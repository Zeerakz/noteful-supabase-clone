
import React, { useEffect, useRef } from 'react';
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
  Globe
} from 'lucide-react';

interface SlashMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (type: string) => void;
  position: { top: number; left: number };
}

const menuItems = [
  { type: 'text', label: 'Text', icon: Type, description: 'Just start writing with plain text' },
  { type: 'heading1', label: 'Heading 1', icon: Heading1, description: 'Big section heading' },
  { type: 'heading2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading' },
  { type: 'heading3', label: 'Heading 3', icon: Heading3, description: 'Small section heading' },
  { type: 'bullet_list', label: 'Bulleted list', icon: List, description: 'Create a simple bulleted list' },
  { type: 'numbered_list', label: 'Numbered list', icon: ListOrdered, description: 'Create a list with numbering' },
  { type: 'quote', label: 'Quote', icon: Quote, description: 'Capture a quote' },
  { type: 'callout', label: 'Callout', icon: MessageSquare, description: 'Make writing stand out' },
  { type: 'toggle', label: 'Toggle list', icon: ChevronRight, description: 'Toggles can hide and show content' },
  { type: 'image', label: 'Image', icon: Image, description: 'Upload or embed with a link' },
  { type: 'embed', label: 'Embed', icon: Globe, description: 'Embed YouTube, Vimeo, CodePen, or any URL' },
  { type: 'table', label: 'Table', icon: Table, description: 'Create a simple table' },
  { type: 'divider', label: 'Divider', icon: Minus, description: 'Visually divide blocks' },
  { type: 'two_column', label: 'Columns', icon: Copy, description: 'Create a two-column layout' },
  { type: 'duplicate_page', label: 'Duplicate page', icon: Copy, description: 'Duplicate this page' },
  { type: 'from_template', label: 'From template', icon: FileText, description: 'Create from a template' },
];

export function SlashMenu({ isOpen, onClose, onSelectItem, position }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (type: string) => {
    console.log('Menu item clicked:', type);
    onSelectItem(type);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 1000,
      }}
      ref={menuRef}
    >
      <Card className="w-[320px] max-h-[400px] overflow-y-auto bg-background border shadow-lg">
        <div className="p-2">
          <div className="text-sm text-muted-foreground mb-2 px-2 py-1">
            Type '/' to insert a block
          </div>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.type}
                onClick={() => handleItemClick(item.type)}
                className="w-full text-left p-2 rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-3 cursor-pointer group"
                type="button"
              >
                <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground group-hover:text-foreground">
                    {item.label}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
