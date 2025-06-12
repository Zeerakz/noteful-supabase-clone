
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
  Globe,
  Paperclip
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
  { type: 'file_attachment', label: 'File', icon: Paperclip, description: 'Upload and attach a file' },
  { type: 'embed', label: 'Embed', icon: Globe, description: 'Embed YouTube, Vimeo, CodePen, Figma, or any URL' },
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 50,
      }}
      ref={menuRef}
    >
      <Card className="w-[300px]">
        <div className="p-2">
          <div className="text-sm text-muted-foreground mb-2">
            Type '/' to insert a block
          </div>
          {menuItems.map((item) => (
            <Button
              key={item.type}
              variant="ghost"
              className="justify-start w-full hover:bg-secondary/50"
              onClick={() => {
                onSelectItem(item.type);
                onClose();
              }}
            >
              <item.icon className="h-4 w-4 mr-2" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
