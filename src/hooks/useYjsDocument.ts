
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
  const isCleaningUpRef = useRef<boolean>(false);

  // Create a shared text object for the document content
  const ytext = ydoc.getText('content');

  const broadcastUpdate = useCallback(async (update: Uint8Array) => {
    if (!user || !pageId || isLocalUpdateRef.current) return;

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
    if (!user || senderId === user.id) return;

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
    if (ytext.toString() === content) return;

    isLocalUpdateRef.current = true;
    ytext.delete(0, ytext.length);
    ytext.insert(0, content);
    isLocalUpdateRef.current = false;
  }, [ytext]);

  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) {
      console.log('Y.js cleanup already in progress, skipping...');
      return;
    }

    isCleaningUpRef.current = true;

    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('Cleaning up Y.js channel subscription');
        const channel = channelRef.current;
        
        // Reset refs before cleanup to prevent race conditions
        channelRef.current = null;
        isSubscribedRef.current = false;
        setIsConnected(false);
        
        // Now safely cleanup the channel
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error during Y.js channel cleanup:', error);
      }
    }

    isCleaningUpRef.current = false;
  }, []);

  // Set up Y.js update listener
  useEffect(() => {
    const updateHandler = (update: Uint8Array, origin: any) => {
      // Only broadcast updates that originate from local changes
      if (origin !== 'remote' && !isLocalUpdateRef.current) {
        broadcastUpdate(update);
      }
      
      // Notify parent component of content changes
      if (onContentChange && !isLocalUpdateRef.current) {
        onContentChange(ytext.toString());
      }
    };

    ydoc.on('update', updateHandler);

    return () => {
      ydoc.off('update', updateHandler);
    };
  }, [ydoc, broadcastUpdate, onContentChange, ytext]);

  // Set up real-time channel for Y.js updates
  useEffect(() => {
    if (!user || !pageId) {
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

    const randomId = Math.random().toString(36).substring(7);
    const channelName = `yjs:${pageId}:${user.id}:${randomId}`;
    
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'yjs-update' }, (payload) => {
        const { pageId: updatePageId, userId, deltaBlob } = payload.payload;
        
        if (updatePageId === pageId && userId !== user.id) {
          applyRemoteUpdate(deltaBlob, userId);
        }
      });

    // Store channel reference before subscribing
    channelRef.current = channel;

    channel.subscribe((status) => {
      console.log('Y.js channel status:', status, 'for channel:', channelName);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        setIsConnected(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
        setIsConnected(false);
        // Only reset channel ref if this is still the current channel
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
      }
    });

    return cleanup;
  }, [user, pageId, applyRemoteUpdate, cleanup]);

  return {
    ydoc,
    ytext,
    isConnected,
    getDocumentContent,
    updateContent,
    applyRemoteUpdate,
  };
}
