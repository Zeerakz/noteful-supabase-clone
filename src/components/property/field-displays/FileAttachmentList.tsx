
import React from 'react';
import { Download, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface FileAttachmentListProps {
  files: FileRecord[];
}

export function FileAttachmentList({ files }: FileAttachmentListProps) {
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

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div key={file.id} className="flex items-center gap-3 p-2 border rounded-lg bg-background">
          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.original_filename}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(file.file_size)}</span>
              {file.mime_type && (
                <Badge variant="outline" className="text-xs">
                  {file.mime_type.split('/')[0]}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadFile(file)}
            className="h-8 w-8 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
