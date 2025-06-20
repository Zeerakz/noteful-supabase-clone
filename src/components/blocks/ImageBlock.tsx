
import React, { useState, useEffect } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ImageBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function ImageBlock({ block, onUpdate, onDelete, isEditable }: ImageBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate signed URL using the Edge Function when component mounts
  useEffect(() => {
    const generateSignedUrl = async () => {
      if (block.content?.path) {
        try {
          const { data, error } = await supabase.functions.invoke('image-upload', {
            method: 'GET',
            body: JSON.stringify({ path: block.content.path })
          });

          if (error) {
            console.error('Error generating signed URL:', error);
            return;
          }

          if (data?.signedUrl) {
            setSignedUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Error generating signed URL:', error);
        }
      }
    };

    generateSignedUrl();
  }, [block.content?.path]);

  const uploadFile = async (file: File) => {
    if (!user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 52428800) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload using the Edge Function
      const { data, error } = await supabase.functions.invoke('image-upload', {
        method: 'POST',
        body: formData
      });

      if (error) {
        throw new Error(error.message || 'Upload failed');
      }

      if (!data?.path) {
        throw new Error('No file path returned from upload');
      }

      // Update block content with file metadata
      await onUpdate({
        path: data.path,
        alt: file.name,
        caption: '',
        originalName: file.name,
        size: file.size,
        type: file.type,
      });

      // Set the signed URL for immediate display
      if (data.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
      
      toast({
        title: "Image uploaded successfully",
        description: "Your image has been uploaded and saved.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    await uploadFile(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    await uploadFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const alt = block.content?.alt || '';
  const caption = block.content?.caption || '';
  const imagePath = block.content?.path;

  if (!isEditable && !imagePath) {
    return null;
  }

  return (
    <div
      className="group relative flex items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-1">
        {imagePath && signedUrl ? (
          <div className="space-y-2">
            <div className="relative">
              <img
                src={signedUrl}
                alt={alt}
                className="max-w-full h-auto rounded border"
                onError={async () => {
                  console.log('Image failed to load, refreshing signed URL');
                  // Try to refresh the signed URL using the Edge Function
                  if (block.content?.path) {
                    try {
                      const { data } = await supabase.functions.invoke('image-upload', {
                        method: 'GET',
                        body: JSON.stringify({ path: block.content.path })
                      });
                      
                      if (data?.signedUrl) {
                        setSignedUrl(data.signedUrl);
                      }
                    } catch (error) {
                      console.error('Error refreshing signed URL:', error);
                    }
                  }
                }}
              />
            </div>
            {caption && (
              <p className="text-sm text-muted-foreground italic text-center">
                {caption}
              </p>
            )}
          </div>
        ) : isEditable ? (
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Drop an image here or click to upload</p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              Supported: JPEG, PNG, GIF, WebP (max 50MB)
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
              id={`image-upload-${block.id}`}
            />
            <Button
              variant="outline"
              asChild
              disabled={isUploading}
            >
              <label htmlFor={`image-upload-${block.id}`} className="cursor-pointer">
                {isUploading ? 'Uploading...' : 'Choose Image'}
              </label>
            </Button>
          </div>
        ) : null}
      </div>
      
      {isEditable && isHovered && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
