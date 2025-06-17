
import React, { useState, useEffect, useRef } from 'react';
import { Block } from '@/types/block';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

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
  const prevTextRef = useRef(text);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Use the centralized realtime manager to avoid duplicate subscriptions
  const { subscribeToBlock, unsubscribeFromBlock } = useRealtimeManager();

  useEffect(() => {
    if (!isEditable) return;

    // Subscribe to realtime updates for this block
    const unsubscribe = subscribeToBlock(block.id, (payload: any) => {
      if (payload.new && payload.new.id === block.id) {
        const newText = payload.new.content?.text || '';
        if (newText !== text && newText !== prevTextRef.current) {
          setText(newText);
          prevTextRef.current = newText;
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

  const handleTextChange = (newText: string) => {
    setText(newText);
    prevTextRef.current = newText;

    if (!isEditable) return;

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce updates
    updateTimeoutRef.current = setTimeout(async () => {
      if (newText !== block.content?.text) {
        setIsUpdating(true);
        try {
          await onUpdate({ text: newText });
        } catch (error) {
          console.error('Error updating text block:', error);
          // Revert to original text on error
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
    }
  };

  if (!isEditable) {
    return (
      <div className="p-2">
        <p className="text-foreground">{text || 'Empty text block'}</p>
      </div>
    );
  }

  return (
    <div className="group relative p-2 rounded-md hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Type something..."
          className="flex-1 border-none bg-transparent focus:bg-background"
          disabled={isUpdating}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {isUpdating && (
        <div className="absolute top-2 right-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
