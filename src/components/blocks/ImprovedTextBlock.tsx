
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Block } from '@/types/block';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImprovedTextBlockProps {
  block: Block;
  pageId: string;
  onUpdate: (content: any) => Promise<{ data: any; error: string | null }>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function ImprovedTextBlock({ block, pageId, onUpdate, onDelete, isEditable }: ImprovedTextBlockProps) {
  const [text, setText] = useState(block.content?.text || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedText, setLastSavedText] = useState(block.content?.text || '');
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const saveAttemptRef = useRef<number>(0);

  // Update local state when block content changes externally
  useEffect(() => {
    const newText = block.content?.text || '';
    if (newText !== text && newText !== lastSavedText) {
      setText(newText);
      setLastSavedText(newText);
      setHasUnsavedChanges(false);
    }
  }, [block.content?.text]);

  // Debounced save function
  const debouncedSave = useCallback(async (textToSave: string) => {
    // Skip saving if text is the same as last saved
    if (textToSave === lastSavedText) {
      console.log('📝 Text unchanged, skipping save');
      return;
    }

    // Allow empty text (remove overly strict validation)
    const trimmedText = textToSave.trim();
    
    setIsUpdating(true);
    setSaveError(null);
    saveAttemptRef.current += 1;
    const currentAttempt = saveAttemptRef.current;

    try {
      console.log('💾 Saving text block:', block.id, textToSave);
      
      const result = await onUpdate({ text: textToSave });
      
      // Check if this is still the latest save attempt
      if (currentAttempt === saveAttemptRef.current) {
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log('✅ Text block saved successfully');
        setLastSavedText(textToSave);
        setHasUnsavedChanges(false);
        setSaveError(null);
        
        // Only show success toast for manual saves, not auto-saves
        if (trimmedText.length === 0) {
          toast({
            title: "Block Updated",
            description: "Text block has been cleared",
          });
        } else if (textToSave !== lastSavedText) {
          toast({
            title: "Block Saved",
            description: "Your changes have been saved",
          });
        }
      }
    } catch (error) {
      console.error('❌ Error saving text block:', error);
      if (currentAttempt === saveAttemptRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
        setSaveError(errorMessage);
        setHasUnsavedChanges(true);
      }
    } finally {
      if (currentAttempt === saveAttemptRef.current) {
        setIsUpdating(false);
      }
    }
  }, [block.id, onUpdate, lastSavedText, toast]);

  // Handle text changes with improved debouncing
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    setHasUnsavedChanges(newText !== lastSavedText);
    setSaveError(null);

    if (!isEditable) return;

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce save - shorter delay for better UX
    updateTimeoutRef.current = setTimeout(() => {
      debouncedSave(newText);
    }, 800);
  }, [isEditable, lastSavedText, debouncedSave]);

  // Manual save function
  const handleManualSave = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    debouncedSave(text);
  }, [text, debouncedSave]);

  // Handle blur - save immediately
  const handleBlur = useCallback(() => {
    if (hasUnsavedChanges && isEditable) {
      handleManualSave();
    }
  }, [hasUnsavedChanges, isEditable, handleManualSave]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    try {
      setIsUpdating(true);
      await onDelete();
      toast({
        title: "Block Deleted",
        description: "Text block has been removed",
      });
    } catch (error) {
      console.error('Error deleting text block:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete block. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [onDelete, toast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Read-only mode
  if (!isEditable) {
    return (
      <div className="p-2">
        <p className="text-foreground whitespace-pre-wrap">
          {text || <em className="text-muted-foreground">Empty text block</em>}
        </p>
      </div>
    );
  }

  return (
    <div className="group relative p-2 rounded-md hover:bg-accent/50 transition-colors space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="Type something..."
            className={`border-none bg-transparent focus:bg-background ${
              saveError ? 'border-red-300 focus:border-red-500' : ''
            } ${hasUnsavedChanges ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
            disabled={isUpdating}
          />
          
          {/* Status indicators */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {isUpdating && (
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" title="Saving..." />
            )}
            {hasUnsavedChanges && !isUpdating && (
              <div className="h-2 w-2 bg-orange-500 rounded-full" title="Unsaved changes" />
            )}
            {saveError && (
              <AlertCircle className="h-3 w-3 text-red-500" title={saveError} />
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasUnsavedChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSave}
              disabled={isUpdating}
              className="h-8 w-8 p-0"
              title="Save changes"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
            disabled={isUpdating}
            title="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Error display */}
      {saveError && (
        <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
          <div className="flex items-center justify-between">
            <span>{saveError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSave}
              className="h-6 text-xs"
              disabled={isUpdating}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
