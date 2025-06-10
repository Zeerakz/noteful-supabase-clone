
import React from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
}

export function EditorToolbar({ onCommand }: EditorToolbarProps) {
  const handleMouseDown = (e: React.MouseEvent, command: string) => {
    e.preventDefault();
    onCommand(command);
  };

  return (
    <div className="flex items-center gap-1 p-1 mb-2 border border-border rounded-md bg-background">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => handleMouseDown(e, 'bold')}
      >
        <Bold className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => handleMouseDown(e, 'italic')}
      >
        <Italic className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => handleMouseDown(e, 'underline')}
      >
        <Underline className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => handleMouseDown(e, 'strikeThrough')}
      >
        <Strikethrough className="h-3 w-3" />
      </Button>
      <div className="w-px h-4 bg-border mx-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => handleMouseDown(e, 'insertUnorderedList')}
      >
        <List className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => handleMouseDown(e, 'insertOrderedList')}
      >
        <ListOrdered className="h-3 w-3" />
      </Button>
    </div>
  );
}
