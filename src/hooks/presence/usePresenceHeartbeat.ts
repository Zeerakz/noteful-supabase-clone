
import { useRef, useEffect } from 'react';
import { sendHeartbeat } from './utils';
import { CursorPosition } from '@/types/presence';

export function usePresenceHeartbeat(
  user: any,
  pageId: string | undefined,
  cursorPositionRef: React.MutableRefObject<CursorPosition | null>
) {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    // Send initial heartbeat immediately
    if (user && pageId) {
      sendHeartbeat(user, pageId, cursorPositionRef);
    }
    
    // Set up recurring heartbeat every 5 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      if (user && pageId) {
        sendHeartbeat(user, pageId, cursorPositionRef);
      }
    }, 5000); // Every 5 seconds
  };

  const stopHeartbeat = () => {
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

    // Start heartbeat when user and pageId are available
    startHeartbeat();
    
    return stopHeartbeat;
  }, [user, pageId]);

  return { stopHeartbeat };
}
