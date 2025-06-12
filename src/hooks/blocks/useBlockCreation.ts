
import { Block } from './types';

export interface BlockInitializer {
  getInitialContent(type: string, customContent?: any): any;
  getDefaultPosition(existingBlocks: Block[], parentBlockId?: string): number;
}

export class BlockCreationService implements BlockInitializer {
  getInitialContent(type: string, customContent?: any): any {
    // If custom content is provided, use it
    if (customContent !== undefined) {
      return customContent;
    }

    // Return default content based on block type
    switch (type) {
      case 'text':
        return {};
      
      case 'heading1':
      case 'heading2':
      case 'heading3':
        return {};
      
      case 'bullet_list':
      case 'numbered_list':
        return { items: [''] };
      
      case 'image':
        return { url: '', caption: '' };
      
      case 'callout':
        return { 
          type: 'info', 
          emoji: '💡', 
          text: '' 
        };
      
      case 'toggle':
        return { 
          title: '', 
          expanded: true 
        };
      
      case 'embed':
        return { 
          url: '' 
        };
      
      case 'file_attachment':
        return {};
      
      case 'table':
        return {
          table: {
            headers: Array.from({ length: 3 }, (_, i) => ({
              id: `header-${i}`,
              content: `Column ${i + 1}`
            })),
            rows: Array.from({ length: 3 }, (_, rowIndex) => ({
              id: `row-${rowIndex}`,
              cells: Array.from({ length: 3 }, (_, colIndex) => ({
                id: `cell-${rowIndex}-${colIndex}`,
                content: ''
              }))
            }))
          }
        };
      
      case 'two_column':
        return { columnSizes: [50, 50] };
      
      case 'divider':
        return {};
      
      case 'quote':
        return {};
      
      default:
        return {};
    }
  }

  getDefaultPosition(existingBlocks: Block[], parentBlockId?: string): number {
    // Filter blocks by parent to get siblings
    const siblingBlocks = existingBlocks.filter(block => 
      (block.parent_block_id || null) === (parentBlockId || null)
    );

    // Return next position
    return siblingBlocks.length > 0 
      ? Math.max(...siblingBlocks.map(block => block.pos)) + 1 
      : 0;
  }
}

export const blockCreationService = new BlockCreationService();
