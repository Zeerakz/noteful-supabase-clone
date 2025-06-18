
import React, { useRef } from 'react';
import { BlockRenderer } from './BlockRenderer';
import { SlashMenu } from './SlashMenu';
import { BlockCreationDropdown } from './BlockCreationDropdown';
import { useCommandHandler } from './CommandHandler';
import { useSlashCommandListener } from './useSlashCommandListener';
import { useStandardizedBlockOperations } from '@/hooks/blocks/useStandardizedBlockOperations';
import { useSlashMenu } from '@/hooks/useSlashMenu';
import { useToast } from '@/hooks/use-toast';
import { Block } from '@/types/block';

interface BlockEditorProps {
  pageId: string;
  isEditable: boolean;
  workspaceId: string;
}

export function BlockEditor({ pageId, isEditable, workspaceId }: BlockEditorProps) {
  const { 
    blocks, 
    loading, 
    error,
    operationInProgress,
    createBlock, 
    updateBlock, 
    deleteBlock 
  } = useStandardizedBlockOperations(workspaceId, pageId);
  
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const { handleCommand } = useCommandHandler({ 
    workspaceId, 
    pageId, 
    createBlock: async (params) => {
      const result = await createBlock(params);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    }
  });

  const { isOpen, position, searchTerm, openSlashMenu, closeSlashMenu, updateSearchTerm, handleSelectItem } = useSlashMenu({
    onSelectCommand: (type: string) => handleCommand(type),
  });

  useSlashCommandListener({
    isEditable,
    openSlashMenu,
    closeSlashMenu,
    updateSearchTerm,
  });

  const handleUpdateBlock = async (id: string, updates: any) => {
    console.log('🔄 BlockEditor - updating block:', id, updates);
    const result = await updateBlock(id, updates);
    if (result.error) {
      console.error('❌ BlockEditor - update failed:', result.error);
      toast({ 
        title: "Update Failed", 
        description: result.error, 
        variant: "destructive" 
      });
    }
    return result;
  };

  const handleDeleteBlock = async (id: string) => {
    console.log('🗑️ BlockEditor - deleting block:', id);
    const result = await deleteBlock(id);
    if (result.error) {
      console.error('❌ BlockEditor - delete failed:', result.error);
      toast({ 
        title: "Delete Failed", 
        description: result.error, 
        variant: "destructive" 
      });
      throw new Error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <div className="text-destructive">Error loading blocks</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  const parentBlocks = blocks.filter(block => block.parent_id === pageId);
  const childBlocks = blocks.filter(block => block.parent_id && block.parent_id !== pageId);

  return (
    <div className="min-h-[400px] space-y-4" ref={editorRef}>
      {/* Operation status indicator */}
      {operationInProgress && (
        <div className="fixed top-4 right-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-md text-sm z-50">
          Processing...
        </div>
      )}

      {/* Content area */}
      <div className="space-y-2">
        {parentBlocks.map((block) => (
          <div
            key={block.id}
            className={`transition-opacity ${
              block.id.startsWith('temp-') ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <BlockRenderer
              block={block}
              pageId={pageId}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
              onCreateBlock={(params: Partial<Block>) => handleCommand(params.type as string)}
              isEditable={isEditable}
              childBlocks={childBlocks}
            />
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {parentBlocks.length === 0 && !isEditable && (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-base">This page is empty.</div>
        </div>
      )}
      
      {/* Add block button - positioned at the bottom */}
      {isEditable && (
        <BlockCreationDropdown onCommand={handleCommand} />
      )}
      
      {/* Slash menu */}
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
