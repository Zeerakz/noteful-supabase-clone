
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Block } from '@/types/block';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface ImprovedTextBlockProps {
  block: Block;
  pageId: string;
  onUpdate: (content: any) => Promise<void>;
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
  const saveRequestId = useRef<number>(0);
  const isMountedRef = useRef(true);
  
  // Debounce text changes with longer timeout for better UX
  const debouncedText = useDebounce(text, 2000);

  // Update local state when block content changes externally
  useEffect(() => {
    const newText = block.content?.text || '';
    if (newText !== text && newText !== lastSavedText) {
      console.log('📝 External content change detected, updating local state');
      setText(newText);
      setLastSavedText(newText);
      setHasUnsavedChanges(false);
      setSaveError(null);
    }
  }, [block.content?.text]);

  // Auto-save when debounced text changes
  useEffect(() => {
    if (!isEditable || !isMountedRef.current) return;
    
    // Skip if text hasn't actually changed from last saved
    if (debouncedText === lastSavedText) {
      console.log('📝 Text unchanged from last saved, skipping auto-save');
      return;
    }

    // Skip if currently updating to prevent duplicate saves
    if (isUpdating) {
      console.log('📝 Save already in progress, skipping auto-save');
      return;
    }

    console.log('📝 Auto-saving debounced text change');
    handleSave(debouncedText, false);
  }, [debouncedText, isEditable, lastSavedText, isUpdating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Enhanced save function with deduplication
  const handleSave = useCallback(async (textToSave: string, showToast: boolean = false) => {
    // Skip if text is the same as last saved
    if (textToSave === lastSavedText) {
      console.log('📝 Text unchanged, skipping save');
      setHasUnsavedChanges(false);
      return;
    }

    // Skip if already saving
    if (isUpdating) {
      console.log('📝 Save already in progress, skipping duplicate');
      return;
    }

    // Generate unique request ID for deduplication
    const requestId = ++saveRequestId.current;
    
    setIsUpdating(true);
    setSaveError(null);

    try {
      console.log(`📝 [${requestId}] Saving text block:`, block.id, textToSave.length, 'chars');
      
      await onUpdate({ text: textToSave });
      
      // Check if this is still the latest save request and component is mounted
      if (requestId === saveRequestId.current && isMountedRef.current) {
        console.log(`✅ [${requestId}] Text block saved successfully`);
        setLastSavedText(textToSave);
        setHasUnsavedChanges(false);
        setSaveError(null);
        
        // Show success toast only for manual saves
        if (showToast) {
          toast({
            title: "Block Saved",
            description: "Your changes have been saved",
          });
        }
      } else {
        console.log(`⏭️ [${requestId}] Save request superseded or component unmounted`);
      }
    } catch (error) {
      console.error(`❌ [${requestId}] Error saving text block:`, error);
      
      // Only handle error if this is still the latest request and component is mounted
      if (requestId === saveRequestId.current && isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
        setSaveError(errorMessage);
        setHasUnsavedChanges(true);
        
        toast({
          title: "Save Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      // Only update state if this is still the latest request and component is mounted
      if (requestId === saveRequestId.current && isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [block.id, onUpdate, lastSavedText, isUpdating, toast]);

  // Handle text input changes
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    setHasUnsavedChanges(newText !== lastSavedText);
    
    // Clear save error when user starts typing
    if (saveError) {
      setSaveError(null);
    }
  }, [lastSavedText, saveError]);

  // Manual save function
  const handleManualSave = useCallback(() => {
    console.log('📝 Manual save triggered');
    handleSave(text, true);
  }, [text, handleSave]);

  // Handle blur - save immediately if there are unsaved changes
  const handleBlur = useCallback(() => {
    if (hasUnsavedChanges && isEditable && !isUpdating) {
      console.log('📝 Blur save triggered');
      handleSave(text, false);
    }
  }, [hasUnsavedChanges, isEditable, isUpdating, text, handleSave]);

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
      setIsUpdating(false);
    }
  }, [onDelete, toast]);

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
            // Never disable input to prevent blocking typing
            disabled={false}
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
              <div title={saveError}>
                <AlertCircle className="h-3 w-3 text-red-500" />
              </div>
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
