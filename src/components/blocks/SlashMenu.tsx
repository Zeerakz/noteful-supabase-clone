import React, { useState, useEffect, useRef } from 'react';
import { Type, Heading1, CheckSquare, Image, Columns2, Copy } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface SlashMenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  command: string;
}

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    id: 'text',
    title: 'Text',
    description: 'Start writing with plain text',
    icon: Type,
    command: 'text',
  },
  {
    id: 'heading',
    title: 'Heading',
    description: 'Big section heading',
    icon: Heading1,
    command: 'heading1',
  },
  {
    id: 'checklist',
    title: 'Checklist',
    description: 'Track tasks with a to-do list',
    icon: CheckSquare,
    command: 'bullet_list',
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Upload or embed with a link',
    icon: Image,
    command: 'image',
  },
  {
    id: 'two-column',
    title: 'Two Column',
    description: 'Create a two-column layout',
    icon: Columns2,
    command: 'two_column',
  },
  {
    id: 'duplicate-page',
    title: 'Duplicate Page',
    description: 'Create a copy of the current page',
    icon: Copy,
    command: 'duplicate_page',
  },
];

interface SlashMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (command: string) => void;
  position: { x: number; y: number };
}

export function SlashMenu({ isOpen, onClose, onSelectItem, position }: SlashMenuProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandRef = useRef<HTMLDivElement>(null);

  const filteredItems = SLASH_MENU_ITEMS.filter(item =>
    item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchValue('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelectItem(filteredItems[selectedIndex].command);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onSelectItem, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-50"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translateY(8px)'
      }}
    >
      <div className="w-80 bg-background border border-border rounded-md shadow-md">
        <Command ref={commandRef} className="rounded-md">
          <CommandInput
            placeholder="Search for commands..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="border-0 focus:ring-0"
          />
          <CommandList className="max-h-64">
            <CommandEmpty>No commands found.</CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => onSelectItem(item.command)}
                    className={`cursor-pointer px-3 py-2 ${
                      index === selectedIndex ? 'bg-accent' : ''
                    }`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-sm text-muted-foreground">{item.description}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
