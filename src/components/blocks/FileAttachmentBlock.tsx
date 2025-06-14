import React, { useState } from 'react';
import { Block } from '@/types/block';
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
  pageId: string;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function FileAttachmentBlock({ block, pageId, onUpdate, onDelete, isEditable }: FileAttachmentBlockProps) {
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
  } = useFileAttachment(block.id, pageId);

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
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <FileUploadArea
              blockId={block.id}
              isUploading={isUploading}
              onFileUpload={handleFileUpload}
            />
          </div>
          
          {isHovered && isEditable && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <FileDisplay
              fileRecord={fileRecord}
              isEditable={isEditable}
              onDownload={downloadFile}
              onRemove={removeFile}
            />
          </div>
          
          {isEditable && (
            <div className="flex items-center gap-1 flex-shrink-0">
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
      )}
    </div>
  );
}
