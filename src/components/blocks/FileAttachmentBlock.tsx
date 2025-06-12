
import React, { useState, useEffect } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Upload, Download, File, Paperclip } from 'lucide-react';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface FileAttachmentBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

interface FileRecord {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  workspace_id: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export function FileAttachmentBlock({ block, onUpdate, onDelete, isEditable }: FileAttachmentBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [fileRecord, setFileRecord] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { comments } = useComments(block.id);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch file record associated with this block
  useEffect(() => {
    const fetchFileRecord = async () => {
      if (!block.id) return;

      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('block_id', block.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching file record:', error);
          return;
        }

        setFileRecord(data);
      } catch (error) {
        console.error('Error fetching file record:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFileRecord();
  }, [block.id]);

  const formatFileSize = (bytes: number = 0) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Get workspace_id from the block's page
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('workspace_id')
      .eq('id', block.page_id)
      .single();

    if (pageError || !pageData) {
      toast({
        title: "Error",
        description: "Could not determine workspace for file upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('planna_uploads')
        .upload(uniqueFilename, file);

      if (uploadError) throw uploadError;

      // Create file record in database
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          filename: uniqueFilename,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: uploadData.path,
          block_id: block.id,
          workspace_id: pageData.workspace_id,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      setFileRecord(fileData);

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
    if (!fileRecord) return;

    try {
      const { data, error } = await supabase.storage
        .from('planna_uploads')
        .download(fileRecord.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileRecord.original_filename;
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
    if (!fileRecord) return;

    try {
      // Remove file from storage
      await supabase.storage
        .from('planna_uploads')
        .remove([fileRecord.storage_path]);

      // Remove file record from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileRecord.id);

      if (error) throw error;

      setFileRecord(null);

      toast({
        title: "Success",
        description: "File removed successfully",
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
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
              <h4 className="text-sm font-medium truncate">{fileRecord.original_filename}</h4>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(fileRecord.file_size)}
                {fileRecord.mime_type && ` • ${fileRecord.mime_type}`}
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
