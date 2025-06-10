
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Type, Heading1, Heading2, Heading3, List, ListOrdered, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BlockRenderer } from './BlockRenderer';
import { SlashMenu } from './SlashMenu';
import { useBlocks } from '@/hooks/useBlocks';
import { useSlashMenu } from '@/hooks/useSlashMenu';
import { useToast } from '@/hooks/use-toast';
import { PresenceProvider, usePresenceContext } from '@/components/collaboration/PresenceProvider';
import { ActiveUsers } from '@/components/collaboration/ActiveUsers';

interface BlockEditorProps {
  pageId: string;
  isEditable: boolean;
}

function BlockEditorContent({ pageId, isEditable }: BlockEditorProps) {
  const { blocks, loading, createBlock, updateBlock, deleteBlock } = useBlocks(pageId);
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // Get presence data from context instead of calling usePresence directly
  const { activeUsers, loading: presenceLoading } = usePresenceContext();

  const { isOpen, position, openSlashMenu, closeSlashMenu, handleSelectItem } = useSlashMenu({
    onSelectCommand: handleCreateBlock,
  });

  async function handleCreateBlock(type: string) {
    if (type === 'two_column') {
      const { data: containerBlock, error: containerError } = await createBlock('two_column', {});
      
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
    } else {
      const { error } = await createBlock(type);
      
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isOpen) {
        const target = event.target as HTMLElement;
        if (target && (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          setTimeout(() => {
            openSlashMenu(target);
          }, 50);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditable, isOpen, openSlashMenu]);

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
      {/* Show active users indicator */}
      {isEditable && (
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <ActiveUsers activeUsers={activeUsers} loading={presenceLoading} />
        </div>
      )}

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
              <DropdownMenuItem onClick={() => handleCreateBlock('image')}>
                <Image className="h-4 w-4 mr-2" />
                Image
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
      />
    </div>
  );
}

export function BlockEditor({ pageId, isEditable }: BlockEditorProps) {
  return (
    <PresenceProvider pageId={pageId}>
      <BlockEditorContent pageId={pageId} isEditable={isEditable} />
    </PresenceProvider>
  );
}
