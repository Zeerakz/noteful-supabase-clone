
import React, { useState, useRef, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface PageTitleEditorProps {
  title: string;
  isEditable: boolean;
  onTitleUpdate: (title: string) => Promise<{ error?: string }>;
  hasOptimisticChanges: boolean;
}

export function PageTitleEditor({ 
  title, 
  isEditable, 
  onTitleUpdate, 
  hasOptimisticChanges 
}: PageTitleEditorProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setTitleValue(title);
  }, [title]);

  const startEditingTitle = () => {
    setTitleValue(title);
    setIsEditingTitle(true);
    // Focus the input after it renders
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const handleTitleSave = async () => {
    if (isSaving) return;

    const trimmedTitle = titleValue.trim();
    
    if (!trimmedTitle) {
      toast({
        title: "Error",
        description: "Page title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (trimmedTitle === title) {
      setIsEditingTitle(false);
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { error } = await onTitleUpdate(trimmedTitle);
      
      if (!error) {
        setIsEditingTitle(false);
      }
      // Error handling is done in the onTitleUpdate function
    } catch (err) {
      console.error('Unexpected error in handleTitleSave:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the title.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleCancel = () => {
    if (isSaving) return;
    setTitleValue(title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (isSaving) return;
    
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTitleCancel();
    }
  };

  if (isEditingTitle) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={titleInputRef}
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
          disabled={isSaving}
          className="text-xl font-semibold border-none bg-transparent p-0 focus-visible:ring-1"
          placeholder="Page title"
        />
        {isSaving && (
          <div className="text-sm text-muted-foreground">Saving...</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-xl font-semibold">{title}</h1>
      {isEditable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={startEditingTitle}
          disabled={isSaving}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
      {hasOptimisticChanges && (
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-2" title="Syncing changes..." />
      )}
    </div>
  );
}
