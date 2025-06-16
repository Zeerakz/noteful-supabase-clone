
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface YjsDocumentOptions {
  pageId: string;
  onContentChange?: (content: any) => void;
}

export function useYjsDocument({ pageId, onContentChange }: YjsDocumentOptions) {
  const { user } = useAuth();
  const [ydoc] = useState(() => new Y.Doc());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const isLocalUpdateRef = useRef(false);
  const isSubscribedRef = useRef<boolean>(false);
  const pageIdRef = useRef<string>(pageId);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);

  // Create a shared text object for the document content
  const ytext = ydoc.getText('content');

  const broadcastUpdate = useCallback(async (update: Uint8Array) => {
    if (!user || !pageId || isLocalUpdateRef.current || !mountedRef.current) return;

    // Don't broadcast if we're still initializing
    if (initializingRef.current) return;

    try {
      // Convert Uint8Array to base64 for transmission
      const deltaBlob = btoa(String.fromCharCode(...update));
      
      // Broadcast the delta blob on the blocks channel
      if (channelRef.current && isSubscribedRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'yjs-update',
          payload: {
            pageId,
            userId: user.id,
            deltaBlob,
            timestamp: Date.now(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to broadcast Y.js update:', error);
    }
  }, [user, pageId]);

  const applyRemoteUpdate = useCallback((deltaBlob: string, senderId: string) => {
    if (!user || senderId === user.id || !mountedRef.current) return;

    try {
      // Convert base64 back to Uint8Array
      const binaryString = atob(deltaBlob);
      const update = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        update[i] = binaryString.charCodeAt(i);
      }

      // Apply the remote update to our document
      isLocalUpdateRef.current = true;
      Y.applyUpdate(ydoc, update);
      isLocalUpdateRef.current = false;
    } catch (error) {
      console.error('Failed to apply remote Y.js update:', error);
    }
  }, [user, ydoc]);

  const getDocumentContent = useCallback(() => {
    return ytext.toString();
  }, [ytext]);

  const updateContent = useCallback((content: string) => {
    if (!mountedRef.current || ytext.toString() === content) return;

    isLocalUpdateRef.current = true;
    ytext.delete(0, ytext.length);
    ytext.insert(0, content);
    isLocalUpdateRef.current = false;
  }, [ytext]);

  const cleanup = useCallback(() => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('Cleaning up Y.js channel subscription');
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        isSubscribedRef.current = false;
      } catch (error) {
        console.warn('Error removing Y.js channel:', error);
      }
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Set up Y.js update listener
  useEffect(() => {
    const updateHandler = (update: Uint8Array, origin: any) => {
      if (!mountedRef.current) return;

      // Only broadcast updates that originate from local changes
      if (origin !== 'remote' && !isLocalUpdateRef.current && !initializingRef.current) {
        broadcastUpdate(update);
      }
      
      // Notify parent component of content changes
      if (onContentChange && !isLocalUpdateRef.current && !initializingRef.current) {
        const content = ytext.toString();
        onContentChange(content);
      }
    };

    ydoc.on('update', updateHandler);

    return () => {
      ydoc.off('update', updateHandler);
    };
  }, [ydoc, broadcastUpdate, onContentChange, ytext]);

  // Set up real-time channel for Y.js updates
  useEffect(() => {
    if (!user || !pageId || !mountedRef.current) {
      cleanup();
      return;
    }

    // Only create new subscription if page changed
    if (pageIdRef.current === pageId && channelRef.current && isSubscribedRef.current) {
      return;
    }

    // Cleanup existing subscription
    cleanup();
    pageIdRef.current = pageId;

    // Set initializing flag to prevent broadcasts during setup
    initializingRef.current = true;

    const randomId = Math.random().toString(36).substring(7);
    const channelName = `yjs:${pageId}:${user.id}:${randomId}`;
    
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'yjs-update' }, (payload) => {
        if (!mountedRef.current) return;

        const { pageId: updatePageId, userId, deltaBlob } = payload.payload;
        
        if (updatePageId === pageId && userId !== user.id) {
          applyRemoteUpdate(deltaBlob, userId);
        }
      })
      .subscribe((status) => {
        if (!mountedRef.current) return;

        console.log('Y.js channel status:', status, 'for channel:', channelName);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          setIsConnected(true);
          // Clear initializing flag after successful connection
          setTimeout(() => {
            initializingRef.current = false;
          }, 100);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          setIsConnected(false);
          initializingRef.current = false;
          if (channelRef.current === channel) {
            channelRef.current = null;
          }
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [user, pageId, applyRemoteUpdate, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    ydoc,
    ytext,
    isConnected,
    getDocumentContent,
    updateContent,
    applyRemoteUpdate,
  };
}
