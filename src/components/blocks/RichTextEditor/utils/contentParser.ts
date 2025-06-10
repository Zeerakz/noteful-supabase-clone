
import { Document, DocumentNode } from '../types';

export function createEmptyDoc(): Document {
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

export function renderToHTML(doc: any): string {
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

export function parseHTMLToJSON(html: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  
  const content: DocumentNode[] = [];
  
  Array.from(body.children).forEach((element) => {
    const node = parseElement(element as HTMLElement);
    if (node) content.push(node);
  });
  
  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }]
  };
}

function parseElement(element: HTMLElement): DocumentNode | null {
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

function parseInlineContent(element: HTMLElement): DocumentNode[] {
  const content: DocumentNode[] = [];
  
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
