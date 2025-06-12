
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TwitterEmbedProps {
  url: string;
  onEdit?: () => void;
  isEditable?: boolean;
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (tweetId: string, element: HTMLElement, options?: any) => Promise<any>;
        load: (element?: HTMLElement) => void;
      };
      ready: (callback: () => void) => void;
    };
  }
}

export function TwitterEmbed({ url, onEdit, isEditable }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [tweetId, setTweetId] = useState<string | null>(null);

  // Extract tweet ID from URL
  useEffect(() => {
    const extractTweetId = (twitterUrl: string) => {
      try {
        const urlObj = new URL(twitterUrl);
        const pathname = urlObj.pathname;
        
        // Handle various Twitter URL formats
        // https://twitter.com/username/status/1234567890
        // https://x.com/username/status/1234567890
        // https://mobile.twitter.com/username/status/1234567890
        const match = pathname.match(/\/status\/(\d+)/);
        return match ? match[1] : null;
      } catch {
        return null;
      }
    };

    const id = extractTweetId(url);
    setTweetId(id);
  }, [url]);

  // Load Twitter widget script
  useEffect(() => {
    if (!tweetId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const loadTwitterWidget = () => {
      // Check if script already exists
      if (document.getElementById('twitter-wjs')) {
        if (window.twttr?.widgets) {
          embedTweet();
        } else {
          window.twttr?.ready(() => {
            embedTweet();
          });
        }
        return;
      }

      // Create and load Twitter widget script
      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        window.twttr?.ready(() => {
          embedTweet();
        });
      };
      script.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    const embedTweet = async () => {
      if (!containerRef.current || !window.twttr?.widgets || !tweetId) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        // Clear container
        containerRef.current.innerHTML = '';
        
        // Create tweet embed
        const tweetElement = await window.twttr.widgets.createTweet(
          tweetId,
          containerRef.current,
          {
            theme: 'light',
            cards: 'visible',
            conversation: 'none',
            align: 'center'
          }
        );

        if (tweetElement) {
          setIsLoading(false);
          setHasError(false);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error embedding tweet:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadTwitterWidget();
  }, [tweetId]);

  if (!tweetId) {
    return (
      <div className="p-4 text-center text-muted-foreground border border-border rounded-lg">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Invalid Twitter/X URL</p>
        {isEditable && (
          <Button onClick={onEdit} variant="outline" size="sm" className="mt-2">
            Edit URL
          </Button>
        )}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4 text-center text-muted-foreground border border-border rounded-lg">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Failed to load tweet</p>
        <p className="text-xs mt-1">The tweet may be private, deleted, or unavailable</p>
        {isEditable && (
          <Button onClick={onEdit} variant="outline" size="sm" className="mt-2">
            Edit URL
          </Button>
        )}
        <div className="mt-3 pt-3 border-t border-border">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            View on Twitter/X
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {isLoading && (
        <div className="p-8 text-center text-muted-foreground border border-border rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-2"></div>
          <p>Loading tweet...</p>
        </div>
      )}
      <div 
        ref={containerRef} 
        className={`${isLoading ? 'hidden' : 'block'} flex justify-center`}
      />
      <div className="mt-3 pt-3 border-t border-border">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{url}</span>
        </a>
      </div>
    </div>
  );
}
