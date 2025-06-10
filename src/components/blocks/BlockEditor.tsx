
import React from 'react';
import { Plus, Type, Heading1, Heading2, Heading3, List, ListOrdered, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BlockRenderer } from './BlockRenderer';
import { useBlocks } from '@/hooks/useBlocks';
import { useToast } from '@/hooks/use-toast';

interface BlockEditorProps {
  pageId: string;
  isEditable: boolean;
}

export function BlockEditor({ pageId, isEditable }: BlockEditorProps) {
  const { blocks, loading, createBlock, updateBlock, deleteBlock } = useBlocks(pageId);
  const { toast } = useToast();

  const handleCreateBlock = async (type: string) => {
    const { error } = await createBlock(type);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  };

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

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          isEditable={isEditable}
        />
      ))}
      
      {isEditable && (
        <div className="pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCreateBlock('text')}>
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
      
      {blocks.length === 0 && !isEditable && (
        <div className="text-center py-8 text-gray-500">
          This page is empty.
        </div>
      )}
    </div>
  );
}
