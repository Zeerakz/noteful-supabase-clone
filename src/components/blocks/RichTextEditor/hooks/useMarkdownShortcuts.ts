
import { useCallback } from 'react';

export function useMarkdownShortcuts(editorRef: React.RefObject<HTMLDivElement>) {
  const convertToHeading = useCallback((level: number, range: Range, textNode: Node) => {
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
  }, [editorRef]);

  const applyInlineFormatting = useCallback((match: RegExpMatchArray, format: string, range: Range, textNode: Node) => {
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
  }, [editorRef]);

  const handleMarkdownShortcuts = useCallback(() => {
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
  }, [editorRef, convertToHeading, applyInlineFormatting]);

  return { handleMarkdownShortcuts };
}
