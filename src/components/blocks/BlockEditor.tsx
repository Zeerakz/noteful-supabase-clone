import React, { useState, useRef, useEffect } from 'react';
import { Plus, Type, Heading1, Heading2, Heading3, List, ListOrdered, Image, Table, Minus, Quote, MessageSquare, ChevronRight, Globe, Paperclip, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BlockRenderer } from './BlockRenderer';
import { SlashMenu } from './SlashMenu';
import { useBlockOperations } from '@/hooks/blocks/useBlockOperations';
import { useSlashMenu } from '@/hooks/useSlashMenu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PageDuplicationService } from '@/services/pageDuplicationService';
import { useNavigate } from 'react-router-dom';
import { Block, BlockType } from '@/types/block';

interface BlockEditorProps {
  pageId: string;
  isEditable: boolean;
  workspaceId: string;
}

export function BlockEditor({ pageId, isEditable, workspaceId }: BlockEditorProps) {
  const { blocks, loading, createBlock, updateBlock, deleteBlock } = useBlockOperations(workspaceId, pageId);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);

  // Map slash menu commands to proper block types
  const mapCommandToBlockType = (command: string): BlockType => {
    switch (command) {
      case 'text': return 'text';
      case 'heading1': return 'heading_1';
      case 'heading2': return 'heading_2';
      case 'heading3': return 'heading_3';
      case 'bullet_list': return 'bulleted_list_item';
      case 'numbered_list': return 'numbered_list_item';
      case 'quote': return 'quote';
      case 'callout': return 'callout';
      case 'toggle': return 'toggle_list';
      case 'image': return 'image';
      case 'file_attachment': return 'file_attachment';
      case 'embed': return 'embed';
      case 'table': return 'table';
      case 'divider': return 'divider';
      case 'two_column': return 'two_column';
      default: return 'text';
    }
  };

  const handleCommand = async (command: string) => {
    console.log('🎯 BlockEditor handling command:', command);

    if (command === 'from_template') {
      if (!workspaceId) {
        toast({ title: "Error", description: "Workspace not found", variant: "destructive" });
        return;
      }
      navigate(`/workspace/${workspaceId}/templates`);
      return;
    }

    if (command === 'duplicate_page') {
      if (!user || !workspaceId) {
        toast({ title: "Error", description: "Unable to duplicate page - user not authenticated or workspace not found", variant: "destructive" });
        return;
      }
      try {
        const { data: newPage, error } = await PageDuplicationService.duplicatePage(pageId, user.id);
        if (error) {
          toast({ title: "Error", description: error, variant: "destructive" });
          return;
        }
        if (newPage) {
          toast({ title: "Success", description: "Page duplicated successfully" });
          navigate(`/workspace/${workspaceId}/page/${newPage.id}`);
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to duplicate page", variant: "destructive" });
      }
      return;
    }
    
    // Map the command to a proper block type
    const blockType = mapCommandToBlockType(command);
    
    const { error } = await createBlock({ 
      type: blockType,
      content: getDefaultContentForType(blockType)
    });
    
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      console.log('✅ Block created successfully:', blockType);
    }
  };

  const getDefaultContentForType = (type: BlockType) => {
    switch (type) {
      case 'text':
        return { text: '' };
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
        return { text: 'Heading' };
      case 'bulleted_list_item':
      case 'numbered_list_item':
        return { text: 'List item' };
      case 'quote':
        return { text: 'Quote' };
      case 'callout':
        return { text: 'Callout', icon: '💡' };
      case 'toggle_list':
        return { text: 'Toggle', expanded: false };
      case 'divider':
        return {};
      case 'image':
        return { url: '', caption: '' };
      case 'embed':
        return { url: '' };
      case 'file_attachment':
        return { filename: '', url: '' };
      case 'table':
        return { 
          rows: [
            ['Header 1', 'Header 2'],
            ['Cell 1', 'Cell 2']
          ]
        };
      case 'two_column':
        return { leftColumn: [], rightColumn: [] };
      default:
        return {};
    }
  };

  const { isOpen, position, searchTerm, openSlashMenu, closeSlashMenu, updateSearchTerm, handleSelectItem } = useSlashMenu({
    onSelectCommand: (type: string) => handleCommand(type),
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
        <div className="flex justify-start pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-muted-foreground border-dashed hover:border-solid hover:text-foreground transition-colors"
                data-cy="add-block-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => handleCommand('text')} data-cy="text-block-option">
                <Type className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Text</span>
                  <span className="text-xs text-muted-foreground">Start writing with plain text</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('heading1')}>
                <Heading1 className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Heading 1</span>
                  <span className="text-xs text-muted-foreground">Big section heading</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('heading2')}>
                <Heading2 className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Heading 2</span>
                  <span className="text-xs text-muted-foreground">Medium section heading</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('heading3')}>
                <Heading3 className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Heading 3</span>
                  <span className="text-xs text-muted-foreground">Small section heading</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('bullet_list')}>
                <List className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Bullet List</span>
                  <span className="text-xs text-muted-foreground">Create a bulleted list</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('numbered_list')}>
                <ListOrdered className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Numbered List</span>
                  <span className="text-xs text-muted-foreground">Create a numbered list</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('quote')}>
                <Quote className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Quote</span>
                  <span className="text-xs text-muted-foreground">Capture a quote</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('callout')}>
                <MessageSquare className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Callout</span>
                  <span className="text-xs text-muted-foreground">Make writing stand out</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('toggle')}>
                <ChevronRight className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Toggle</span>
                  <span className="text-xs text-muted-foreground">Create collapsible content</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('image')}>
                <Image className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Image</span>
                  <span className="text-xs text-muted-foreground">Upload or embed an image</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('two_column')}>
                <Columns className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Columns</span>
                  <span className="text-xs text-muted-foreground">Create a two-column layout</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('table')}>
                <Table className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Table</span>
                  <span className="text-xs text-muted-foreground">Create a simple table</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('divider')}>
                <Minus className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Divider</span>
                  <span className="text-xs text-muted-foreground">Visually divide sections</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('file_attachment')}>
                <Paperclip className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">File</span>
                  <span className="text-xs text-muted-foreground">Attach a file</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCommand('embed')}>
                <Globe className="h-4 w-4 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Embed</span>
                  <span className="text-xs text-muted-foreground">Embed content from the web</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
