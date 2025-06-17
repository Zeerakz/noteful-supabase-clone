
import React, { useState, useEffect, useRef } from 'react';
import { Block } from '@/types/block';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle } from 'lucide-react';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';
import { GentleError } from '@/components/ui/gentle-error';

interface TextBlockProps {
  block: Block;
  pageId: string;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function TextBlock({ block, pageId, onUpdate, onDelete, isEditable }: TextBlockProps) {
  const [text, setText] = useState(block.content?.text || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastValidText, setLastValidText] = useState(block.content?.text || '');
  const prevTextRef = useRef(text);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Use the centralized realtime manager to avoid duplicate subscriptions
  const { subscribeToBlock } = useRealtimeManager();

  useEffect(() => {
    if (!isEditable) return;

    // Subscribe to realtime updates for this block
    const unsubscribe = subscribeToBlock(block.id, (payload: any) => {
      if (payload.new && payload.new.id === block.id) {
        const newText = payload.new.content?.text || '';
        if (newText !== text && newText !== prevTextRef.current) {
          setText(newText);
          setLastValidText(newText);
          prevTextRef.current = newText;
          // Clear validation error when receiving valid content from server
          setValidationError(null);
        }
      }
    });

    return () => {
      unsubscribe();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [block.id, isEditable, subscribeToBlock, text]);

  const validateContent = (content: string): { isValid: boolean; error?: string } => {
    // Trim whitespace for validation
    const trimmedContent = content.trim();
    
    if (trimmedContent.length === 0) {
      return {
        isValid: false,
        error: 'Text blocks cannot be empty'
      };
    }
    
    // Additional validation: check for only whitespace characters
    if (!/\S/.test(content)) {
      return {
        isValid: false,
        error: 'Text blocks must contain meaningful content'
      };
    }
    
    // Check minimum length (optional - can be customized)
    if (trimmedContent.length < 1) {
      return {
        isValid: false,
        error: 'Text must be at least 1 character long'
      };
    }
    
    return { isValid: true };
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    prevTextRef.current = newText;
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }

    if (!isEditable) return;

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce updates
    updateTimeoutRef.current = setTimeout(async () => {
      // Validate content before saving
      const validation = validateContent(newText);
      
      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid content');
        // Revert to last valid text if current content is invalid
        if (lastValidText !== newText) {
          setTimeout(() => {
            setText(lastValidText);
            prevTextRef.current = lastValidText;
          }, 2000); // Give user time to see the error
        }
        return;
      }

      // Only update if content has actually changed and is valid
      if (newText !== block.content?.text) {
        setIsUpdating(true);
        try {
          await onUpdate({ text: newText });
          setLastValidText(newText); // Update last valid text on successful save
          setValidationError(null);
        } catch (error) {
          console.error('Error updating text block:', error);
          setValidationError('Failed to save changes');
          // Revert to original text on save error
          setText(block.content?.text || '');
          prevTextRef.current = block.content?.text || '';
        } finally {
          setIsUpdating(false);
        }
      }
    }, 500);
  };

  const handleDelete = async () => {
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting text block:', error);
      setValidationError('Failed to delete block');
    }
  };

  const handleBlur = () => {
    // Validate on blur and revert if invalid
    const validation = validateContent(text);
    if (!validation.isValid && lastValidText) {
      setValidationError(validation.error || 'Invalid content');
      setText(lastValidText);
      prevTextRef.current = lastValidText;
    }
  };

  const dismissValidationError = () => {
    setValidationError(null);
  };

  if (!isEditable) {
    return (
      <div className="p-2">
        <p className="text-foreground">{text || 'Empty text block'}</p>
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
              validationError ? 'border-red-300 focus:border-red-500' : ''
            }`}
            disabled={isUpdating}
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'text-block-error' : undefined}
          />
          {isUpdating && (
            <div className="absolute top-2 right-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          disabled={isUpdating}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {validationError && (
        <div id="text-block-error">
          <GentleError
            type="validation"
            message={validationError}
            suggestion="Try adding some meaningful text content."
            onDismiss={dismissValidationError}
          />
        </div>
      )}
    </div>
  );
}
