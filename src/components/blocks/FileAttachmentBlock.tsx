
import React, { useState } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Upload, Download, File, Paperclip } from 'lucide-react';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileAttachmentBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

interface FileContent {
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  fileType?: string;
}

export function FileAttachmentBlock({ block, onUpdate, onDelete, isEditable }: FileAttachmentBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { comments } = useComments(block.id);
  const { toast } = useToast();

  const content: FileContent = block.content || {};
  const { fileName, fileSize, filePath, fileType } = content;

  const formatFileSize = (bytes: number = 0) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('planna_uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update block content with file information
      await onUpdate({
        fileName: file.name,
        fileSize: file.size,
        filePath: uploadData.path,
        fileType: file.type,
      });

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleDownload = async () => {
    if (!filePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('planna_uploads')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFile = async () => {
    try {
      // Remove file from storage if it exists
      if (filePath) {
        await supabase.storage
          .from('planna_uploads')
          .remove([filePath]);
      }

      // Clear block content
      await onUpdate({});
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
  };

  if (!isEditable && !fileName) {
    return null;
  }

  return (
    <div
      className="group relative my-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!fileName ? (
        <div className="border-2 border-dashed border-muted rounded-lg p-6">
          <div className="text-center">
            <Paperclip className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-sm font-medium mb-2">Upload a file</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Click to browse or drag and drop a file
            </p>
            <div className="flex justify-center">
              <Button 
                asChild
                variant="outline" 
                size="sm" 
                disabled={isUploading}
                className="cursor-pointer"
              >
                <label htmlFor={`file-upload-${block.id}`}>
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </label>
              </Button>
              <Input
                id={`file-upload-${block.id}`}
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4 bg-background">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <File className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{fileName}</h4>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(fileSize)}
                {fileType && ` • ${fileType}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              {isEditable && (
                <Button
                  onClick={handleRemoveFile}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isHovered && isEditable && fileName && (
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
