
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from './RichTextEditor';

interface TextBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function TextBlock({ block, onUpdate, onDelete, isEditable }: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = async (richTextContent: any) => {
    await onUpdate({ richText: richTextContent });
    setIsEditing(false);
  };

  // Check if content exists
  const hasContent = block.content?.richText && 
    block.content.richText.content && 
    block.content.richText.content.length > 0 &&
    block.content.richText.content.some((node: any) => 
      node.content && node.content.length > 0 && 
      node.content.some((textNode: any) => textNode.text && textNode.text.trim())
    );

  if (!isEditable && !hasContent) {
    return null;
  }

  if (isEditing) {
    return (
      <div className="group relative">
        <RichTextEditor
          initialContent={block.content?.richText}
          onBlur={handleBlur}
          placeholder="Type something..."
        />
      </div>
    );
  }

  return (
    <div className="group relative">
      <div
        className={`p-2 rounded cursor-text min-h-[2.5rem] ${
          isEditable ? 'hover:bg-muted/50' : ''
        } ${!hasContent ? 'text-muted-foreground' : ''}`}
        onClick={() => isEditable && setIsEditing(true)}
      >
        {hasContent ? (
          <div dangerouslySetInnerHTML={{ __html: renderRichTextToHTML(block.content.richText) }} />
        ) : (
          isEditable ? 'Click to add text...' : ''
        )}
      </div>
      {isEditable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive hover:text-destructive/80"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Helper function to render rich text JSON to HTML
function renderRichTextToHTML(richTextJSON: any): string {
  if (!richTextJSON || !richTextJSON.content) return '';

  return richTextJSON.content.map((node: any) => {
    switch (node.type) {
      case 'paragraph':
        const paragraphContent = renderInlineContent(node.content || []);
        return paragraphContent ? `<p>${paragraphContent}</p>` : '<p><br></p>';
      case 'heading':
        const level = node.attrs?.level || 1;
        return `<h${level}>${renderInlineContent(node.content || [])}</h${level}>`;
      case 'bulletList':
        return `<ul>${renderListContent(node.content || [])}</ul>`;
      case 'orderedList':
        return `<ol>${renderListContent(node.content || [])}</ol>`;
      default:
        return renderInlineContent(node.content || []);
    }
  }).join('');
}

function renderInlineContent(content: any[]): string {
  return content.map((node: any) => {
    if (node.type === 'text') {
      let text = node.text || '';
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'strike':
              text = `<s>${text}</s>`;
              break;
          }
        });
      }
      return text;
    }
    return '';
  }).join('');
}

function renderListContent(content: any[]): string {
  return content.map((listItem: any) => {
    if (listItem.type === 'listItem') {
      return `<li>${renderInlineContent(listItem.content || [])}</li>`;
    }
    return '';
  }).join('');
}
