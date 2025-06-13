
import React, { useState, useEffect } from 'react';
import { FileAttachmentPropertyConfig } from '@/types/property';
import { supabase } from '@/integrations/supabase/client';
import { FileAttachmentList } from './FileAttachmentList';
import { FileAttachmentGallery } from './FileAttachmentGallery';
import { FileAttachmentTable } from './FileAttachmentTable';

interface FileAttachmentFieldDisplayProps {
  value: any;
  config: FileAttachmentPropertyConfig;
  field?: any;
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

export function FileAttachmentFieldDisplay({ value, config, pageId }: FileAttachmentFieldDisplayProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);

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

  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground text-sm">No files</span>;
  }

  if (loading) {
    return <span className="text-muted-foreground text-sm">Loading files...</span>;
  }

  if (files.length === 0) {
    return <span className="text-muted-foreground text-sm">Files not found</span>;
  }

  const displayAs = config.displayAs || 'list';

  switch (displayAs) {
    case 'gallery':
      return <FileAttachmentGallery files={files} />;
    case 'table':
      return <FileAttachmentTable files={files} />;
    default:
      return <FileAttachmentList files={files} />;
  }
}
