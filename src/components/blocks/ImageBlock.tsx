
import React, { useState, useEffect } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  // Generate signed URL when component mounts if there's a stored path
  useEffect(() => {
    const generateSignedUrl = async () => {
      if (block.content?.path) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const response = await fetch(
            `https://vwntvuhhplzkbvogggkg.supabase.co/functions/v1/image-upload?path=${encodeURIComponent(block.content.path)}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setSignedUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Error generating signed URL:', error);
        }
      }
    };

    generateSignedUrl();
  }, [block.content?.path]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'https://vwntvuhhplzkbvogggkg.supabase.co/functions/v1/image-upload',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      await onUpdate({
        path: data.path,
        alt: file.name,
        caption: '',
        originalName: file.name,
        size: file.size,
        type: file.type,
      });

      setSignedUrl(data.signedUrl);
      
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
                // If image fails to load, try to refresh the signed URL
                console.log('Image failed to load, signed URL may have expired');
              }}
            />
          </div>
          {caption && (
            <p className="text-sm text-gray-600 italic text-center">
              {caption}
            </p>
          )}
        </div>
      ) : isEditable ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Click to upload an image</p>
          <p className="text-xs text-gray-400 mb-4">
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
          className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
