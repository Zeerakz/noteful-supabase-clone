
import React from 'react';
import { CrdtTextEditor } from '../../CrdtTextEditor/CrdtTextEditor';

interface TableCellProps {
  content: string;
  pageId: string;
  blockId: string;
  isEditable: boolean;
  onUpdate: (content: any) => Promise<void>;
}

export function TableCell({ content, pageId, blockId, isEditable, onUpdate }: TableCellProps) {
  const handleContentChange = async (newContent: any) => {
    // Extract text content and update
    const textContent = typeof newContent === 'string' ? newContent : (newContent?.text || '');
    console.log('Table cell content changed:', textContent);
    await onUpdate(textContent);
  };

  return (
    <td className="border-r border-border last:border-r-0 relative group">
      <div className="p-2 min-w-[120px] min-h-[40px]">
        {isEditable ? (
          <CrdtTextEditor
            pageId={pageId}
            blockId={`${blockId}-cell`}
            initialContent={content || ''}
            onContentChange={handleContentChange}
            placeholder="Enter text..."
            className="text-sm"
          />
        ) : (
          <div
            className="text-sm min-h-[20px]"
            dangerouslySetInnerHTML={{ __html: content || '' }}
          />
        )}
      </div>
    </td>
  );
}
