import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  initialContent?: any;
  onBlur: (content: any) => void;
  placeholder?: string;
}

export function RichTextEditor({ initialContent, onBlur, placeholder = "Start typing..." }: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent || createEmptyDoc());
  const editorRef = useRef<HTMLDivElement>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = renderToHTML(initialContent);
    }
  }, [initialContent]);

  const handleFocus = () => {
    setIsToolbarVisible(true);
  };

  const handleBlur = () => {
    setIsToolbarVisible(false);
    if (editorRef.current) {
      const newContent = parseHTMLToJSON(editorRef.current.innerHTML);
      setContent(newContent);
      onBlur(newContent);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      // Check for markdown shortcuts before parsing
      handleMarkdownShortcuts();
      
      const newContent = parseHTMLToJSON(editorRef.current.innerHTML);
      setContent(newContent);
    }
  };

  const handleMarkdownShortcuts = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const text = textNode.textContent || '';
    const cursorPos = range.startOffset;
    
    // Check for heading shortcuts at the beginning of a line
    if (text.startsWith('# ') && cursorPos > 1) {
      convertToHeading(1, range, textNode);
    } else if (text.startsWith('## ') && cursorPos > 2) {
      convertToHeading(2, range, textNode);
    } else if (text.startsWith('### ') && cursorPos > 3) {
      convertToHeading(3, range, textNode);
    }
    
    // Check for bold formatting **text**
    const boldMatch = text.match(/\*\*(.*?)\*\*/);
    if (boldMatch && cursorPos > boldMatch.index! + boldMatch[0].length) {
      applyInlineFormatting(boldMatch, 'bold', range, textNode);
    }
    
    // Check for italic formatting *text*
    const italicMatch = text.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    if (italicMatch && cursorPos > italicMatch.index! + italicMatch[0].length) {
      applyInlineFormatting(italicMatch, 'italic', range, textNode);
    }
  };

  const convertToHeading = (level: number, range: Range, textNode: Node) => {
    const parent = textNode.parentElement;
    if (!parent || !editorRef.current) return;

    const text = textNode.textContent || '';
    const headingText = text.substring(level + 1); // Remove # and space
    
    // Create heading element
    const heading = document.createElement(`h${level}`);
    heading.textContent = headingText;
    
    // Replace the paragraph with heading
    if (parent.tagName === 'P') {
      parent.replaceWith(heading);
    } else {
      textNode.textContent = headingText;
      const newHeading = document.createElement(`h${level}`);
      newHeading.textContent = headingText;
      parent.replaceWith(newHeading);
    }
    
    // Set cursor at the end of the heading
    const newRange = document.createRange();
    const selection = window.getSelection();
    newRange.setStart(heading.firstChild || heading, headingText.length);
    newRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(newRange);
  };

  const applyInlineFormatting = (match: RegExpMatchArray, format: string, range: Range, textNode: Node) => {
    if (!match.index || !editorRef.current) return;

    const text = textNode.textContent || '';
    const beforeText = text.substring(0, match.index);
    const formattedText = match[1];
    const afterText = text.substring(match.index + match[0].length);
    
    // Create text nodes
    const beforeNode = document.createTextNode(beforeText);
    const afterNode = document.createTextNode(afterText);
    
    // Create formatted element
    const formatElement = document.createElement(format === 'bold' ? 'strong' : 'em');
    formatElement.textContent = formattedText;
    
    // Replace the text node
    const parent = textNode.parentNode;
    if (parent) {
      parent.insertBefore(beforeNode, textNode);
      parent.insertBefore(formatElement, textNode);
      parent.insertBefore(afterNode, textNode);
      parent.removeChild(textNode);
      
      // Set cursor after the formatted text
      const newRange = document.createRange();
      const selection = window.getSelection();
      newRange.setStart(afterNode, 0);
      newRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
    
    // Handle Enter key to prevent markdown shortcuts from being applied on new lines
    if (e.key === 'Enter') {
      // Let the default behavior happen, but we might want to handle this later
      // for better block-level formatting
    }
  };

  return (
    <div className="relative">
      {isToolbarVisible && (
        <div className="flex items-center gap-1 p-1 mb-2 border border-border rounded-md bg-background">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('bold');
            }}
          >
            <Bold className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('italic');
            }}
          >
            <Italic className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('underline');
            }}
          >
            <Underline className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('strikeThrough');
            }}
          >
            <Strikethrough className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('insertUnorderedList');
            }}
          >
            <List className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('insertOrderedList');
            }}
          >
            <ListOrdered className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="w-full min-h-[2.5rem] p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />
    </div>
  );
}

function createEmptyDoc() {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: []
      }
    ]
  };
}

function renderToHTML(doc: any): string {
  if (!doc || !doc.content) return '';
  
  return doc.content.map((node: any) => {
    switch (node.type) {
      case 'paragraph':
        const paragraphContent = node.content ? renderInlineNodes(node.content) : '';
        return paragraphContent ? `<p>${paragraphContent}</p>` : '<p><br></p>';
      case 'heading':
        const level = node.attrs?.level || 1;
        return `<h${level}>${renderInlineNodes(node.content || [])}</h${level}>`;
      case 'bulletList':
        return `<ul>${renderListItems(node.content || [])}</ul>`;
      case 'orderedList':
        return `<ol>${renderListItems(node.content || [])}</ol>`;
      default:
        return '';
    }
  }).join('');
}

function renderInlineNodes(nodes: any[]): string {
  return nodes.map((node: any) => {
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

function renderListItems(items: any[]): string {
  return items.map((item: any) => {
    if (item.type === 'listItem') {
      return `<li>${renderInlineNodes(item.content || [])}</li>`;
    }
    return '';
  }).join('');
}

function parseHTMLToJSON(html: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  
  const content: any[] = [];
  
  Array.from(body.children).forEach((element) => {
    const node = parseElement(element as HTMLElement);
    if (node) content.push(node);
  });
  
  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }]
  };
}

function parseElement(element: HTMLElement): any {
  const tagName = element.tagName.toLowerCase();
  
  switch (tagName) {
    case 'p':
      return {
        type: 'paragraph',
        content: parseInlineContent(element)
      };
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return {
        type: 'heading',
        attrs: { level: parseInt(tagName.charAt(1)) },
        content: parseInlineContent(element)
      };
    case 'ul':
      return {
        type: 'bulletList',
        content: Array.from(element.children).map(li => ({
          type: 'listItem',
          content: parseInlineContent(li as HTMLElement)
        }))
      };
    case 'ol':
      return {
        type: 'orderedList',
        content: Array.from(element.children).map(li => ({
          type: 'listItem',
          content: parseInlineContent(li as HTMLElement)
        }))
      };
    default:
      return null;
  }
}

function parseInlineContent(element: HTMLElement): any[] {
  const content: any[] = [];
  
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        content.push({
          type: 'text',
          text: text
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const text = el.textContent || '';
      if (text) {
        const marks: any[] = [];
        
        // Check for formatting marks
        if (el.tagName === 'STRONG' || el.tagName === 'B') marks.push({ type: 'bold' });
        if (el.tagName === 'EM' || el.tagName === 'I') marks.push({ type: 'italic' });
        if (el.tagName === 'U') marks.push({ type: 'underline' });
        if (el.tagName === 'S') marks.push({ type: 'strike' });
        
        content.push({
          type: 'text',
          text: text,
          marks: marks.length > 0 ? marks : undefined
        });
      }
    }
  }
  
  return content;
}
