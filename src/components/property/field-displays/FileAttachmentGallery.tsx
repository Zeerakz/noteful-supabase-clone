
import React from 'react';
import { Download, File, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatFileSize } from '@/utils/fileUtils';

interface FileRecord {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
}

interface FileAttachmentGalleryProps {
  files: FileRecord[];
}

export function FileAttachmentGallery({ files }: FileAttachmentGalleryProps) {
  const downloadFile = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from('planna_uploads')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  const getFileUrl = (file: FileRecord) => {
    return supabase.storage.from('planna_uploads').getPublicUrl(file.storage_path).data.publicUrl;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => (
        <div key={file.id} className="border rounded-lg overflow-hidden bg-background">
          <div className="aspect-square relative bg-muted flex items-center justify-center">
            {isImage(file.mime_type) ? (
              <img
                src={getFileUrl(file)}
                alt={file.original_filename}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`flex items-center justify-center w-full h-full ${isImage(file.mime_type) ? 'hidden' : ''}`}>
              <File className="h-12 w-12 text-muted-foreground" />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadFile(file)}
              className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium truncate" title={file.original_filename}>
              {file.original_filename}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.file_size)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
