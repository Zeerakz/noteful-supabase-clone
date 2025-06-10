
import { useEffect } from 'react';
import { cleanupPresence, sendHeartbeat } from './utils';
import { CursorPosition } from '@/types/presence';

export function usePresenceLifecycle(
  user: any,
  pageId: string | undefined,
  cursorPositionRef: React.MutableRefObject<CursorPosition | null>
) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupPresence(user, pageId!);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupPresence(user, pageId!);
      } else if (!document.hidden && user && pageId) {
        // Re-establish presence when tab becomes visible again
        sendHeartbeat(user, pageId, cursorPositionRef);
      }
    };

    if (user && pageId) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, pageId, cursorPositionRef]);
}
