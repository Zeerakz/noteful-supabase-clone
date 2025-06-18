
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PageDuplicationService } from '@/services/pageDuplicationService';
import { useNavigate } from 'react-router-dom';
import { BlockType } from '@/types/block';

export interface UseCommandHandlerProps {
  workspaceId: string;
  pageId: string;
  createBlock: (params: { type: BlockType; content?: any }) => Promise<{ error?: string }>;
}

export function useCommandHandler({ workspaceId, pageId, createBlock }: UseCommandHandlerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleCommand = async (command: string) => {
    console.log('🎯 CommandHandler handling command:', command);

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

  return { handleCommand };
}
