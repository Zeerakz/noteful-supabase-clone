
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileIcon, AlertCircle } from 'lucide-react';
import { FileAttachmentPropertyConfig } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/utils/fileUtils';

interface FileUploadDropzoneProps {
  onFileUpload: (files: File[]) => void;
  config: FileAttachmentPropertyConfig;
  uploading: boolean;
  currentFileCount: number;
}

export function FileUploadDropzone({ 
  onFileUpload, 
  config, 
  uploading, 
  currentFileCount 
}: FileUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (config.maxFileSize && file.size > config.maxFileSize) {
      return `File size exceeds ${formatFileSize(config.maxFileSize)} limit`;
    }

    // Check file type
    if (config.allowedTypes?.length && !config.allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    // Check file extension
    if (config.allowedExtensions?.length) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!config.allowedExtensions.includes(extension)) {
        return `File extension ${extension} is not allowed`;
      }
    }

    return null;
  }, [config]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setDragActive(false);
    
    // Check file count limit
    if (config.maxFiles && (currentFileCount + acceptedFiles.length) > config.maxFiles) {
      alert(`Maximum ${config.maxFiles} files allowed`);
      return;
    }

    // Validate all files
    const validFiles: File[] = [];
    const errors: string[] = [];

    acceptedFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(`Some files were rejected:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      onFileUpload(validFiles);
    }
  }, [onFileUpload, config, currentFileCount, validateFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    multiple: !config.maxFiles || config.maxFiles > 1,
    accept: config.allowedTypes?.length ? 
      config.allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : 
      undefined,
  });

  const canUploadMore = !config.maxFiles || currentFileCount < config.maxFiles;

  if (!canUploadMore) {
    return (
      <div className="text-center p-4 border border-dashed rounded-lg bg-muted/50">
        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Maximum number of files reached ({config.maxFiles})
        </p>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive || dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
      `}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
    >
      <input {...getInputProps()} />
      
      {uploading ? (
        <div className="space-y-3">
          <Upload className="h-8 w-8 mx-auto text-primary animate-pulse" />
          <div>
            <p className="text-sm font-medium">Uploading files...</p>
            <Progress value={undefined} className="w-full mt-2" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <FileIcon className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive || dragActive ? 'Drop files here' : 'Drag files here or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {config.maxFileSize && `Max file size: ${formatFileSize(config.maxFileSize)}`}
              {config.maxFiles && ` • Max files: ${config.maxFiles}`}
            </p>
            {config.allowedTypes?.length && (
              <p className="text-xs text-muted-foreground mt-1">
                Allowed types: {config.allowedTypes.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
