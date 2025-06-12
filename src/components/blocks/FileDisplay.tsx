
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, File } from 'lucide-react';
import { formatFileSize } from '@/utils/fileUtils';

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

interface FileDisplayProps {
  fileRecord: FileRecord;
  isEditable: boolean;
  onDownload: () => void;
  onRemove: () => void;
}

export function FileDisplay({ fileRecord, isEditable, onDownload, onRemove }: FileDisplayProps) {
  return (
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
            onClick={onDownload}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          {isEditable && (
            <Button
              onClick={onRemove}
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
  );
}
