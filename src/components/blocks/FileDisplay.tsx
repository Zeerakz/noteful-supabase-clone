
import React from 'react';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';
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
    <div className="flex-1 border border-border rounded-lg p-4 bg-background">
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
            Download
          </Button>
          {isEditable && (
            <Button
              onClick={onRemove}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c0-1-1-2-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
