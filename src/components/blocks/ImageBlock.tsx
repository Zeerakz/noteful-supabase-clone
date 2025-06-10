
import React, { useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';

interface ImageBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function ImageBlock({ block, onUpdate, onDelete, isEditable }: ImageBlockProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // For now, we'll just store a placeholder URL
    // In a real implementation, you'd upload to Supabase Storage
    const mockUrl = URL.createObjectURL(file);
    
    await onUpdate({
      url: mockUrl,
      alt: file.name,
      caption: ''
    });
    
    setIsUploading(false);
  };

  const imageUrl = block.content?.url;
  const alt = block.content?.alt || '';
  const caption = block.content?.caption || '';

  if (!isEditable && !imageUrl) {
    return null;
  }

  return (
    <div className="group relative">
      {imageUrl ? (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full h-auto rounded border"
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
          <input
            type="file"
            accept="image/*"
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
