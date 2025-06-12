
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tweetId, setTweetId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Extract tweet ID from URL with better validation
  useEffect(() => {
    const extractTweetId = (twitterUrl: string) => {
      try {
        console.log('TwitterEmbed: Extracting tweet ID from URL:', twitterUrl);
        
        // Clean the URL first
        const cleanUrl = twitterUrl.trim();
        const urlObj = new URL(cleanUrl);
        const hostname = urlObj.hostname.toLowerCase();
        
        // Check if it's a valid Twitter/X domain
        const validDomains = ['twitter.com', 'x.com', 'mobile.twitter.com', 'www.twitter.com', 'www.x.com'];
        const isValidDomain = validDomains.some(domain => hostname.includes(domain));
        
        if (!isValidDomain) {
          console.log('TwitterEmbed: Invalid domain:', hostname);
          return null;
        }
        
        const pathname = urlObj.pathname;
        console.log('TwitterEmbed: Pathname:', pathname);
        
        // Handle various Twitter URL formats
        // https://twitter.com/username/status/1234567890
        // https://x.com/username/status/1234567890
        // https://mobile.twitter.com/username/status/1234567890
        const statusMatch = pathname.match(/\/status\/(\d+)/);
        if (statusMatch) {
          const id = statusMatch[1];
          console.log('TwitterEmbed: Extracted tweet ID:', id);
          return id;
        }
        
        // Also try to handle URLs with query parameters
        const tweetParam = urlObj.searchParams.get('status') || urlObj.searchParams.get('tweet');
        if (tweetParam) {
          console.log('TwitterEmbed: Extracted tweet ID from params:', tweetParam);
          return tweetParam;
        }
        
        console.log('TwitterEmbed: No tweet ID found in URL');
        return null;
      } catch (error) {
        console.error('TwitterEmbed: Error extracting tweet ID:', error);
        return null;
      }
    };

    const id = extractTweetId(url);
    setTweetId(id);
    
    if (!id) {
      setHasError(true);
      setErrorMessage('Invalid Twitter/X URL format');
      setIsLoading(false);
    }
  }, [url]);

  // Load Twitter widget script and embed tweet
  useEffect(() => {
    if (!tweetId) {
      return;
    }

    const loadTwitterWidget = async () => {
      try {
        console.log('TwitterEmbed: Starting to load Twitter widget for tweet:', tweetId);
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');

        // Check if script already exists
        const existingScript = document.getElementById('twitter-wjs');
        
        if (existingScript && window.twttr?.widgets) {
          console.log('TwitterEmbed: Twitter widget script already loaded, embedding tweet');
          await embedTweet();
          return;
        }

        if (existingScript && !window.twttr?.widgets) {
          console.log('TwitterEmbed: Script exists but widgets not ready, waiting...');
          // Wait for existing script to load
          const checkReady = setInterval(() => {
            if (window.twttr?.widgets) {
              clearInterval(checkReady);
              embedTweet();
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkReady);
            if (!window.twttr?.widgets) {
              console.error('TwitterEmbed: Timeout waiting for Twitter widgets to load');
              handleEmbedError('Twitter widgets failed to load (timeout)');
            }
          }, 10000);
          return;
        }

        // Create and load new script
        console.log('TwitterEmbed: Creating new Twitter widget script');
        const script = document.createElement('script');
        script.id = 'twitter-wjs';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          console.log('TwitterEmbed: Twitter script loaded successfully');
          if (window.twttr?.ready) {
            window.twttr.ready(() => {
              console.log('TwitterEmbed: Twitter widgets ready');
              embedTweet();
            });
          } else {
            console.error('TwitterEmbed: Twitter script loaded but twttr.ready not available');
            handleEmbedError('Twitter widgets initialization failed');
          }
        };
        
        script.onerror = (error) => {
          console.error('TwitterEmbed: Failed to load Twitter script:', error);
          handleEmbedError('Failed to load Twitter widgets script');
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('TwitterEmbed: Error in loadTwitterWidget:', error);
        handleEmbedError('Failed to initialize Twitter embed');
      }
    };

    const embedTweet = async () => {
      if (!containerRef.current || !window.twttr?.widgets || !tweetId) {
        console.error('TwitterEmbed: Missing requirements for embedding:', {
          container: !!containerRef.current,
          widgets: !!window.twttr?.widgets,
          tweetId
        });
        handleEmbedError('Missing requirements for embedding tweet');
        return;
      }

      try {
        console.log('TwitterEmbed: Attempting to embed tweet:', tweetId);
        
        // Clear container
        containerRef.current.innerHTML = '';
        
        // Create tweet embed with error handling
        const embedOptions = {
          theme: 'light',
          cards: 'visible',
          conversation: 'none',
          align: 'center',
          dnt: true, // Do Not Track
          width: 550
        };
        
        console.log('TwitterEmbed: Calling createTweet with options:', embedOptions);
        
        const tweetElement = await window.twttr.widgets.createTweet(
          tweetId,
          containerRef.current,
          embedOptions
        );

        if (tweetElement) {
          console.log('TwitterEmbed: Tweet embedded successfully');
          setIsLoading(false);
          setHasError(false);
          setErrorMessage('');
        } else {
          console.error('TwitterEmbed: createTweet returned null/undefined');
          handleEmbedError('Tweet not found or unavailable');
        }
      } catch (error) {
        console.error('TwitterEmbed: Error embedding tweet:', error);
        handleEmbedError('Failed to embed tweet');
      }
    };

    const handleEmbedError = (message: string) => {
      console.error('TwitterEmbed: Embed error:', message);
      setHasError(true);
      setErrorMessage(message);
      setIsLoading(false);
    };

    loadTwitterWidget();
  }, [tweetId, retryCount]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      console.log('TwitterEmbed: Retrying embed, attempt:', retryCount + 1);
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setErrorMessage('');
      setIsLoading(true);
    }
  };

  if (!tweetId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium">Invalid Twitter/X URL</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please use a valid Twitter or X.com status URL
            </p>
          </div>
          {isEditable && (
            <Button onClick={onEdit} variant="outline" size="sm">
              Edit URL
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (hasError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <div>
              <p className="font-medium">Failed to load tweet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMessage || 'The tweet may be private, deleted, or unavailable'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {retryCount < maxRetries && (
                <Button onClick={handleRetry} variant="outline" size="sm">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry ({maxRetries - retryCount} left)
                </Button>
              )}
              {isEditable && (
                <Button onClick={onEdit} variant="outline" size="sm">
                  Edit URL
                </Button>
              )}
            </div>
            
            <div className="pt-2 border-t border-border">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View on Twitter/X
              </a>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col">
      {isLoading && (
        <Alert>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
            <span>Loading tweet...</span>
          </div>
        </Alert>
      )}
      
      <div 
        ref={containerRef} 
        className={`${isLoading ? 'hidden' : 'block'} flex justify-center min-h-[200px]`}
        style={{ minHeight: isLoading ? '0' : '200px' }}
      />
      
      {!isLoading && !hasError && (
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
      )}
    </div>
  );
}
