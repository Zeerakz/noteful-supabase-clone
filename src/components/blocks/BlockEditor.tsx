import React, { useState, useRef, useEffect } from 'react';
import { Plus, Type, Heading1, Heading2, Heading3, List, ListOrdered, Image, Table, Minus, Quote, MessageSquare, ChevronRight, Globe, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BlockRenderer } from './BlockRenderer';
import { SlashMenu } from './SlashMenu';
import { useBlocks } from '@/hooks/useBlocks';
import { useSlashMenu } from '@/hooks/useSlashMenu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PageDuplicationService } from '@/services/pageDuplicationService';
import { useNavigate } from 'react-router-dom';

interface BlockEditorProps {
  pageId: string;
  isEditable: boolean;
  workspaceId?: string;
}

// Optional presence context hook
function useOptionalPresenceContext() {
  try {
    // Try to import and use the presence context
    const { usePresenceContext } = require('@/components/collaboration/PresenceProvider');
    return usePresenceContext();
  } catch (error) {
    // If not available, return empty state
    console.log('Presence context not available, continuing without real-time features');
    return {
      activeUsers: [],
      loading: false,
      updateCursorPosition: async () => {},
      sendHeartbeat: async () => {}
    };
  }
}

export function BlockEditor({ pageId, isEditable, workspaceId }: BlockEditorProps) {
  const { blocks, loading, createBlock, updateBlock, deleteBlock } = useBlocks(pageId);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // Use optional presence context - won't crash if not available
  const { activeUsers, loading: presenceLoading } = useOptionalPresenceContext();

  const { isOpen, position, searchTerm, openSlashMenu, closeSlashMenu, updateSearchTerm, handleSelectItem } = useSlashMenu({
    onSelectCommand: handleCreateBlock,
  });

  async function handleCreateBlock(type: string, content?: any, parentBlockId?: string) {
    if (type === 'from_template') {
      if (!workspaceId) {
        toast({
          title: "Error",
          description: "Workspace not found",
          variant: "destructive",
        });
        return;
      }

      // Navigate to templates page
      navigate(`/workspace/${workspaceId}/templates`);
      return;
    }

    if (type === 'duplicate_page') {
      if (!user || !workspaceId) {
        toast({
          title: "Error",
          description: "Unable to duplicate page - user not authenticated or workspace not found",
          variant: "destructive",
        });
        return;
      }

      try {
        const { data: newPage, error } = await PageDuplicationService.duplicatePage(pageId, user.id);
        
        if (error) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
          return;
        }

        if (newPage) {
          toast({
            title: "Success",
            description: "Page duplicated successfully",
          });
          
          // Navigate to the new page
          navigate(`/workspace/${workspaceId}/page/${newPage.id}`);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to duplicate page",
          variant: "destructive",
        });
      }
      return;
    }

    if (type === 'two_column') {
      const { data: containerBlock, error: containerError } = await createBlock('two_column', {}, parentBlockId);
      
      if (containerError) {
        toast({
          title: "Error",
          description: containerError,
          variant: "destructive",
        });
        return;
      }

      if (containerBlock) {
        const { error: leftError } = await createBlock('text', { column: 'left' }, containerBlock.id);
        const { error: rightError } = await createBlock('text', { column: 'right' }, containerBlock.id);
        
        if (leftError || rightError) {
          toast({
            title: "Error",
            description: leftError || rightError || "Failed to create column blocks",
            variant: "destructive",
          });
        }
      }
    } else if (type === 'callout') {
      const { error } = await createBlock(type, { 
        type: 'info', 
        emoji: '💡', 
        text: '' 
      }, parentBlockId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    } else if (type === 'toggle') {
      const { error } = await createBlock(type, { 
        title: '', 
        expanded: true 
      }, parentBlockId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    } else if (type === 'embed') {
      const { error } = await createBlock(type, { 
        url: '' 
      }, parentBlockId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    } else if (type === 'file_attachment') {
      const { error } = await createBlock(type, {}, parentBlockId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    } else if (type === 'table') {
      const { error } = await createBlock(type, {
        rows: 3,
        cols: 3,
        data: Array(3).fill(null).map(() => Array(3).fill(''))
      }, parentBlockId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    } else {
      const { error } = await createBlock(type, content || {}, parentBlockId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    }
  }

  const handleUpdateBlock = async (id: string, updates: any) => {
    const { error } = await updateBlock(id, updates);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBlock = async (id: string) => {
    const { error } = await deleteBlock(id);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isEditable) return;

    let isTrackingSlash = false;
    let slashPosition = 0;
    let currentElement: HTMLElement | null = null;

    const getSelectionStart = (element: HTMLElement): number => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        return element.selectionStart || 0;
      }
      // For contentEditable elements, we'll use 0 as a fallback
      return 0;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if we're in an editable element
      if (!target || !(target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (event.key === '/') {
        // Start tracking for slash commands
        isTrackingSlash = true;
        slashPosition = getSelectionStart(target);
        currentElement = target;
        
        // Small delay to let the '/' character be inserted
        setTimeout(() => {
          if (currentElement) {
            openSlashMenu(currentElement, '');
          }
        }, 50);
      } else if (isTrackingSlash && currentElement) {
        if (event.key === 'Escape') {
          isTrackingSlash = false;
          closeSlashMenu();
        } else if (event.key === 'Enter' || event.key === 'Tab') {
          // Don't interfere with menu navigation
          return;
        } else if (event.key === 'Backspace') {
          // Check if we're deleting the slash
          const currentPos = getSelectionStart(currentElement);
          if (currentPos <= slashPosition) {
            isTrackingSlash = false;
            closeSlashMenu();
          }
        } else if (event.key.length === 1) {
          // Update search term as user types
          setTimeout(() => {
            if (currentElement && isTrackingSlash) {
              const text = currentElement.textContent || '';
              const slashIndex = text.lastIndexOf('/');
              if (slashIndex !== -1) {
                const term = text.substring(slashIndex + 1);
                updateSearchTerm(term);
              }
            }
          }, 10);
        }
      }
    };

    const handleInput = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (isTrackingSlash && currentElement === target) {
        const text = target.textContent || '';
        const slashIndex = text.lastIndexOf('/');
        
        if (slashIndex === -1) {
          // Slash was removed
          isTrackingSlash = false;
          closeSlashMenu();
        } else {
          const term = text.substring(slashIndex + 1);
          updateSearchTerm(term);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('input', handleInput);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('input', handleInput);
    };
  }, [isEditable, openSlashMenu, closeSlashMenu, updateSearchTerm]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  const parentBlocks = blocks.filter(block => !block.parent_block_id);
  const childBlocks = blocks.filter(block => block.parent_block_id);

  return (
    <div className="space-y-2 p-4" ref={editorRef}>
      {parentBlocks.map((block) => (
        <div 
          key={block.id} 
          className={`transition-opacity ${
            block.id.startsWith('temp-') ? 'opacity-60' : 'opacity-100'
          }`}
          onFocus={() => setFocusedBlockId(block.id)}
          onBlur={() => setFocusedBlockId(null)}
        >
          <BlockRenderer
            block={block}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onCreateBlock={handleCreateBlock}
            isEditable={isEditable}
            childBlocks={childBlocks}
          />
        </div>
      ))}
      
      {isEditable && (
        <div className="pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-cy="add-block-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCreateBlock('text')} data-cy="text-block-option">
                <Type className="h-4 w-4 mr-2" />
                Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('heading1')}>
                <Heading1 className="h-4 w-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('heading2')}>
                <Heading2 className="h-4 w-4 mr-2" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('heading3')}>
                <Heading3 className="h-4 w-4 mr-2" />
                Heading 3
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('bullet_list')}>
                <List className="h-4 w-4 mr-2" />
                Bullet List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('numbered_list')}>
                <ListOrdered className="h-4 w-4 mr-2" />
                Numbered List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('quote')}>
                <Quote className="h-4 w-4 mr-2" />
                Quote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('callout')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Callout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('toggle')}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Toggle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('image')}>
                <Image className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('table')}>
                <Table className="h-4 w-4 mr-2" />
                Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('divider')}>
                <Minus className="h-4 w-4 mr-2" />
                Divider
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('file_attachment')}>
                <Paperclip className="h-4 w-4 mr-2" />
                File Attachment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBlock('embed')}>
                <Globe className="h-4 w-4 mr-2" />
                Embed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {parentBlocks.length === 0 && !isEditable && (
        <div className="text-center py-8 text-muted-foreground">
          This page is empty.
        </div>
      )}

      <SlashMenu
        isOpen={isOpen}
        onClose={closeSlashMenu}
        onSelectItem={handleSelectItem}
        position={position}
        searchTerm={searchTerm}
      />
    </div>
  );
}
