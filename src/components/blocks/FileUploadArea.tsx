
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Paperclip } from 'lucide-react';

interface FileUploadAreaProps {
  blockId: string;
  isUploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUploadArea({ blockId, isUploading, onFileUpload }: FileUploadAreaProps) {
  return (
    <div className="border-2 border-dashed border-muted rounded-lg p-4">
      <div className="text-center">
        <Paperclip className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <h3 className="text-sm font-medium mb-1">Upload a file</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Click to browse or drag and drop a file
        </p>
        <div className="flex justify-center">
          <Button 
            asChild
            variant="outline" 
            size="sm" 
            disabled={isUploading}
            className="cursor-pointer h-8"
          >
            <label htmlFor={`file-upload-${blockId}`}>
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
            id={`file-upload-${blockId}`}
            type="file"
            onChange={onFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
