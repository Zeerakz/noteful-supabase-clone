
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

export function useFileAttachment(blockId: string, pageId: string) {
  const [fileRecord, setFileRecord] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch file record associated with this block
  useEffect(() => {
    const fetchFileRecord = async () => {
      if (!blockId) return;

      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('block_id', blockId)
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
  }, [blockId]);

  const uploadFile = async (file: File) => {
    if (!file || !user) return;

    // Get workspace_id from the block's page
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('workspace_id')
      .eq('id', pageId)
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
          block_id: blockId,
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
    }
  };

  const downloadFile = async () => {
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

  const removeFile = async () => {
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

  return {
    fileRecord,
    loading,
    isUploading,
    uploadFile,
    downloadFile,
    removeFile,
  };
}
