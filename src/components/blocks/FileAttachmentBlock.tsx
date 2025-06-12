
import React, { useState } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';
import { useFileAttachment } from '@/hooks/useFileAttachment';
import { FileUploadArea } from './FileUploadArea';
import { FileDisplay } from './FileDisplay';

interface FileAttachmentBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function FileAttachmentBlock({ block, onUpdate, onDelete, isEditable }: FileAttachmentBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { comments } = useComments(block.id);
  
  const {
    fileRecord,
    loading,
    isUploading,
    uploadFile,
    downloadFile,
    removeFile,
  } = useFileAttachment(block.id, block.page_id);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadFile(file);
    // Reset the input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="my-4 p-4 border border-border rounded-lg">
        <div className="text-center text-muted-foreground">Loading file...</div>
      </div>
    );
  }

  if (!isEditable && !fileRecord) {
    return null;
  }

  return (
    <div
      className="group relative my-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!fileRecord ? (
        <FileUploadArea
          blockId={block.id}
          isUploading={isUploading}
          onFileUpload={handleFileUpload}
        />
      ) : (
        <FileDisplay
          fileRecord={fileRecord}
          isEditable={isEditable}
          onDownload={downloadFile}
          onRemove={removeFile}
        />
      )}
      
      {isHovered && isEditable && fileRecord && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
          <CommentThreadPanel
            blockId={block.id}
            isOpen={isCommentPanelOpen}
            onOpenChange={setIsCommentPanelOpen}
          >
            <CommentIcon
              hasComments={comments.length > 0}
              commentCount={comments.length}
              onClick={() => setIsCommentPanelOpen(true)}
            />
          </CommentThreadPanel>
          
          <Button
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
