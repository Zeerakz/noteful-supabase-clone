
import React from 'react';
import { CrdtTextEditor } from '../../CrdtTextEditor/CrdtTextEditor';

interface TableCellProps {
  content: string;
  pageId: string;
  blockId: string;
  isEditable: boolean;
  onUpdate: (content: any) => void;
}

export function TableCell({ content, pageId, blockId, isEditable, onUpdate }: TableCellProps) {
  return (
    <td className="border-r border-border last:border-r-0 relative group">
      <div className="p-2 min-w-[120px] min-h-[40px]">
        {isEditable ? (
          <CrdtTextEditor
            pageId={pageId}
            blockId={blockId}
            initialContent={content}
            onContentChange={onUpdate}
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
