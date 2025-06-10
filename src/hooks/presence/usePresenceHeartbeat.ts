
import { useRef, useEffect } from 'react';
import { sendHeartbeat } from './utils';
import { CursorPosition } from '@/types/presence';

export function usePresenceHeartbeat(
  user: any,
  pageId: string | undefined,
  cursorPositionRef: React.MutableRefObject<CursorPosition | null>
) {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(true);

  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    // Send initial heartbeat immediately
    if (user && pageId && isActiveRef.current) {
      sendHeartbeat(user, pageId, cursorPositionRef);
    }
    
    // Set up recurring heartbeat every 10 seconds (reduced frequency)
    heartbeatIntervalRef.current = setInterval(() => {
      if (user && pageId && isActiveRef.current) {
        sendHeartbeat(user, pageId, cursorPositionRef);
      }
    }, 10000); // Every 10 seconds instead of 5
  };

  const stopHeartbeat = () => {
    isActiveRef.current = false;
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!user || !pageId) {
      stopHeartbeat();
      return;
    }

    isActiveRef.current = true;
    // Start heartbeat when user and pageId are available
    startHeartbeat();
    
    return stopHeartbeat;
  }, [user, pageId]);

  // Handle page visibility changes to pause/resume heartbeat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
      } else {
        isActiveRef.current = true;
        // Resume heartbeat when page becomes visible
        if (user && pageId) {
          sendHeartbeat(user, pageId, cursorPositionRef);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, pageId, cursorPositionRef]);

  return { stopHeartbeat };
}
