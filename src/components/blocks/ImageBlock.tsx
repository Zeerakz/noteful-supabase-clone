
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
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate signed URL when component mounts if there's a stored path
  useEffect(() => {
    const generateSignedUrl = async () => {
      if (block.content?.path) {
        try {
          const { data, error } = await supabase.storage
            .from('planna_uploads')
            .createSignedUrl(block.content.path, 3600); // 1 hour expiry

          if (error) {
            console.error('Error generating signed URL:', error);
            return;
          }

          setSignedUrl(data.signedUrl);
        } catch (error) {
          console.error('Error generating signed URL:', error);
        }
      }
    };

    generateSignedUrl();
  }, [block.content?.path]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('planna_uploads')
        .upload(fileName, file);

      if (error) {
        throw new Error(error.message);
      }

      // Generate signed URL for immediate display
      const { data: signedUrlData } = await supabase.storage
        .from('planna_uploads')
        .createSignedUrl(data.path, 3600);

      // Update block content with file metadata
      await onUpdate({
        path: data.path,
        alt: file.name,
        caption: '',
        originalName: file.name,
        size: file.size,
        type: file.type,
      });

      if (signedUrlData) {
        setSignedUrl(signedUrlData.signedUrl);
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

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    // Create a synthetic event to reuse the upload logic
    const syntheticEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>;
    
    await handleImageUpload(syntheticEvent);
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
    <div className="group relative">
      {imagePath && signedUrl ? (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={signedUrl}
              alt={alt}
              className="max-w-full h-auto rounded border"
              onError={() => {
                console.log('Image failed to load, signed URL may have expired');
                // Try to refresh the signed URL
                if (block.content?.path) {
                  supabase.storage
                    .from('planna_uploads')
                    .createSignedUrl(block.content.path, 3600)
                    .then(({ data }) => {
                      if (data) {
                        setSignedUrl(data.signedUrl);
                      }
                    });
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
      
      {isEditable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive hover:text-destructive/80"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
