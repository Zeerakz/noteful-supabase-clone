
import React, { useState, useEffect, useCallback } from 'react';
import { FileAttachmentPropertyConfig } from '@/types/property';
import { FileUploadDropzone } from './FileUploadDropzone';
import { FileAttachmentList } from '../field-displays/FileAttachmentList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FileAttachmentFieldEditorProps {
  value: string;
  config: FileAttachmentPropertyConfig;
  onChange: (value: string) => void;
  field: any;
  workspaceId: string;
  pageId?: string;
}

interface FileRecord {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
}

export function FileAttachmentFieldEditor({ 
  value, 
  config, 
  onChange, 
  field, 
  workspaceId, 
  pageId 
}: FileAttachmentFieldEditorProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load existing files
  useEffect(() => {
    if (!value || value.trim() === '' || !pageId) {
      setFiles([]);
      return;
    }

    const loadFiles = async () => {
      setLoading(true);
      try {
        const fileIds = JSON.parse(value);
        if (Array.isArray(fileIds) && fileIds.length > 0) {
          const { data, error } = await supabase
            .from('property_file_attachments')
            .select('*')
            .in('id', fileIds)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('Error loading files:', error);
          } else {
            setFiles(data || []);
          }
        }
      } catch (error) {
        console.error('Error parsing file data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [value, pageId]);

  const updateValue = useCallback((newFiles: FileRecord[]) => {
    const fileIds = newFiles.map(f => f.id);
    onChange(JSON.stringify(fileIds));
  }, [onChange]);

  const handleFileUpload = async (uploadedFiles: File[]) => {
    if (!user || !pageId) return;

    // Check file limits
    if (config.maxFiles && (files.length + uploadedFiles.length) > config.maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${config.maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newFiles: FileRecord[] = [];

    try {
      for (const file of uploadedFiles) {
        // Validate file size
        if (config.maxFileSize && file.size > config.maxFileSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the maximum size limit`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file type
        if (config.allowedTypes?.length && !config.allowedTypes.includes(file.type)) {
          toast({
            title: "File type not allowed",
            description: `${file.name} has an unsupported file type`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file extension
        if (config.allowedExtensions?.length) {
          const extension = '.' + file.name.split('.').pop()?.toLowerCase();
          if (!config.allowedExtensions.includes(extension)) {
            toast({
              title: "File extension not allowed",
              description: `${file.name} has an unsupported file extension`,
              variant: "destructive",
            });
            continue;
          }
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('planna_uploads')
          .upload(uniqueFilename, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        // Create database record
        const { data: fileData, error: fileError } = await supabase
          .from('property_file_attachments')
          .insert({
            page_id: pageId,
            field_id: field.id,
            filename: uniqueFilename,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: uploadData.path,
            workspace_id: workspaceId,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (fileError) {
          console.error('Database error:', fileError);
          // Clean up uploaded file
          await supabase.storage.from('planna_uploads').remove([uploadData.path]);
          toast({
            title: "Database error",
            description: `Failed to save ${file.name} information`,
            variant: "destructive",
          });
          continue;
        }

        newFiles.push(fileData);
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        updateValue(updatedFiles);
        
        toast({
          title: "Upload successful",
          description: `${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} uploaded`,
        });
      }
    } catch (error) {
      console.error('Upload process error:', error);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileRemove = async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (!fileToRemove) return;

    try {
      // Remove from storage
      await supabase.storage
        .from('planna_uploads')
        .remove([fileToRemove.storage_path]);

      // Remove from database
      const { error } = await supabase
        .from('property_file_attachments')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      updateValue(updatedFiles);

      toast({
        title: "File removed",
        description: `${fileToRemove.original_filename} has been removed`,
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
    return <div className="text-sm text-muted-foreground">Loading files...</div>;
  }

  return (
    <div className="space-y-4">
      <FileUploadDropzone
        onFileUpload={handleFileUpload}
        config={config}
        uploading={uploading}
        currentFileCount={files.length}
      />
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.original_filename}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => handleFileRemove(file.id)}
                className="text-destructive hover:text-destructive/80 text-sm px-2 py-1"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
