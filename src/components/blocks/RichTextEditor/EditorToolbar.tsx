
import React from 'react';
import { Bold, Italic, Underline, Strikethrough, Link, Unlink, Code, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
}

export function EditorToolbar({ onCommand }: EditorToolbarProps) {
  const handleMouseDown = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    onCommand(command, value);
  };

  return (
    <div 
      className="flex items-center gap-1 p-1 border border-border rounded-md bg-background"
      data-testid="editor-toolbar"
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        data-testid="bold-button"
        onMouseDown={(e) => handleMouseDown(e, 'bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        data-testid="italic-button"
        onMouseDown={(e) => handleMouseDown(e, 'italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        data-testid="underline-button"
        onMouseDown={(e) => handleMouseDown(e, 'underline')}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        data-testid="strikethrough-button"
        onMouseDown={(e) => handleMouseDown(e, 'strikeThrough')}
        title="Strikethrough (Ctrl+Shift+S)"
      >
        <Strikethrough className="h-3 w-3" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        data-testid="code-button"
        onMouseDown={(e) => handleMouseDown(e, 'insertHTML', '<code></code>')}
        title="Inline Code (Ctrl+`)"
      >
        <Code className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        data-testid="highlight-button"
        onMouseDown={(e) => handleMouseDown(e, 'hiliteColor', '#fef08a')}
        title="Highlight Text"
      >
        <Highlighter className="h-3 w-3" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        data-testid="link-button"
        onMouseDown={(e) => handleMouseDown(e, 'createLink')}
        title="Add Link (Ctrl+K)"
      >
        <Link className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        data-testid="unlink-button"
        onMouseDown={(e) => handleMouseDown(e, 'unlink')}
        title="Remove Link"
      >
        <Unlink className="h-3 w-3" />
      </Button>
    </div>
  );
}
