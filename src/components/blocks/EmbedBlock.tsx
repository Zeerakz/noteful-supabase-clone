
import React, { useState, useEffect } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ExternalLink, Globe } from 'lucide-react';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';

interface EmbedBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

interface EmbedContent {
  url?: string;
  title?: string;
  embedUrl?: string;
  type?: string;
}

export function EmbedBlock({ block, onUpdate, onDelete, isEditable }: EmbedBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { comments } = useComments(block.id);

  const content: EmbedContent = block.content || {};
  const { url, title, embedUrl, type } = content;

  useEffect(() => {
    if (!url && isEditable) {
      setIsEditing(true);
    }
  }, [url, isEditable]);

  const getEmbedInfo = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      const hostname = urlObj.hostname.toLowerCase();

      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        let videoId = '';
        if (hostname.includes('youtube.com')) {
          videoId = urlObj.searchParams.get('v') || '';
        } else {
          videoId = urlObj.pathname.slice(1);
        }
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          title: 'YouTube Video'
        };
      }

      // Vimeo
      if (hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/')[1];
        return {
          type: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          title: 'Vimeo Video'
        };
      }

      // CodePen
      if (hostname.includes('codepen.io')) {
        const parts = urlObj.pathname.split('/');
        if (parts[1] && parts[2] && parts[3]) {
          return {
            type: 'codepen',
            embedUrl: `https://codepen.io/${parts[1]}/embed/${parts[3]}`,
            title: 'CodePen'
          };
        }
      }

      // Figma
      if (hostname.includes('figma.com')) {
        // Figma URLs typically look like: https://www.figma.com/file/FILE_ID/FILE_NAME
        // or https://www.figma.com/proto/FILE_ID/FILE_NAME
        const pathParts = urlObj.pathname.split('/');
        if ((pathParts[1] === 'file' || pathParts[1] === 'proto') && pathParts[2]) {
          const fileId = pathParts[2];
          return {
            type: 'figma',
            embedUrl: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(inputUrl)}`,
            title: 'Figma Design'
          };
        }
      }

      // Generic embed - just show the URL in an iframe
      return {
        type: 'generic',
        embedUrl: inputUrl,
        title: 'Embedded Content'
      };
    } catch (error) {
      return null;
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    const embedInfo = getEmbedInfo(urlInput.trim());
    if (embedInfo) {
      await onUpdate({
        url: urlInput.trim(),
        ...embedInfo
      });
      setIsEditing(false);
      setUrlInput('');
    }
  };

  const handleEdit = () => {
    setUrlInput(url || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setUrlInput('');
    setIsEditing(false);
    if (!url) {
      onDelete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUrlSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isEditable && !url) {
    return null;
  }

  return (
    <div
      className="group relative my-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 border-2 border-dashed border-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Embed URL</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste a YouTube, Vimeo, CodePen, Figma, or any URL..."
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1"
              />
              <Button onClick={handleUrlSubmit} size="sm">
                Embed
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supports YouTube, Vimeo, CodePen, Figma, and other embeddable URLs
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 border border-border rounded-lg overflow-hidden bg-background">
            {embedUrl ? (
              <div className="relative">
                <iframe
                  src={embedUrl}
                  title={title}
                  className="w-full h-64 md:h-80"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {isEditable && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => window.open(url, '_blank')}
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={handleEdit}
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Globe className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Unable to embed this URL</p>
                {isEditable && (
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Edit URL
                  </Button>
                )}
              </div>
            )}
            
            {url && (
              <div className="p-3 border-t border-border bg-muted/50">
                <div className="flex items-center justify-between">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{url}</span>
                  </a>
                  {isEditable && (
                    <Button
                      onClick={handleEdit}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {isHovered && isEditable && !isEditing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
              <CommentThreadPanel
                blockId={block.id}
                isOpen={isCommentPanelOpen}
                onOpenChange={setIsCommentPanelOpen}
              >
                <CommentIcon
                  hasComments={comments.length > 0}
                  commentCount={comments.length}
                  onClick={() => setIsCommentPanelOpen(true)}
                />
              </CommentThreadPanel>
              
              <Button
                onClick={onDelete}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
