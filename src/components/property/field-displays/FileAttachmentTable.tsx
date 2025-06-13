
import React from 'react';
import { Download, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface FileAttachmentTableProps {
  files: FileRecord[];
}

export function FileAttachmentTable({ files }: FileAttachmentTableProps) {
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate" title={file.original_filename}>
                    {file.original_filename}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {file.mime_type.split('/')[0]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatFileSize(file.file_size)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadFile(file)}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
