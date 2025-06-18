
import React, { useRef } from 'react';
import { BlockRenderer } from './BlockRenderer';
import { SlashMenu } from './SlashMenu';
import { BlockCreationDropdown } from './BlockCreationDropdown';
import { useCommandHandler } from './CommandHandler';
import { useSlashCommandListener } from './useSlashCommandListener';
import { useBlockOperations } from '@/hooks/blocks/useBlockOperations';
import { useSlashMenu } from '@/hooks/useSlashMenu';
import { useToast } from '@/hooks/use-toast';
import { Block } from '@/types/block';

interface BlockEditorProps {
  pageId: string;
  isEditable: boolean;
  workspaceId: string;
}

export function BlockEditor({ pageId, isEditable, workspaceId }: BlockEditorProps) {
  const { blocks, loading, createBlock, updateBlock, deleteBlock } = useBlockOperations(workspaceId, pageId);
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const { handleCommand } = useCommandHandler({ workspaceId, pageId, createBlock });

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
    const { error } = await updateBlock(id, updates);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  };

  const handleDeleteBlock = async (id: string) => {
    const { error } = await deleteBlock(id);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  const parentBlocks = blocks.filter(block => block.parent_id === pageId);
  const childBlocks = blocks.filter(block => block.parent_id && block.parent_id !== pageId);

  return (
    <div className="min-h-[400px] space-y-4" ref={editorRef}>
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
