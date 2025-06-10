
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CursorPosition, ActiveUser } from '@/types/presence';
import { UsePresenceReturn } from './presence/types';
import { updateCursorPosition, fetchActiveUsers, cleanupPresence } from './presence/utils';
import { usePresenceSubscription } from './presence/usePresenceSubscription';
import { usePresenceHeartbeat } from './presence/usePresenceHeartbeat';
import { usePresenceLifecycle } from './presence/usePresenceLifecycle';

export function usePresence(pageId?: string): UsePresenceReturn {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const cursorPositionRef = useRef<CursorPosition | null>(null);

  const handleFetchActiveUsers = useCallback(async () => {
    if (!pageId) {
      setActiveUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const users = await fetchActiveUsers(pageId, user?.id);
      setActiveUsers(users);
    } catch (err) {
      console.error('Failed to fetch active users:', err);
    } finally {
      setLoading(false);
    }
  }, [pageId, user?.id]);

  const handleUpdateCursorPosition = useCallback(async (x: number, y: number, blockId?: string) => {
    if (!pageId) return;
    await updateCursorPosition(user, pageId, x, y, blockId, cursorPositionRef);
  }, [user, pageId]);

  const handleSendHeartbeat = useCallback(async () => {
    if (!pageId) return;
    const { sendHeartbeat } = await import('./presence/utils');
    await sendHeartbeat(user, pageId, cursorPositionRef);
  }, [user, pageId]);

  // Set up subscription for real-time updates
  const { cleanup } = usePresenceSubscription(user, pageId, handleFetchActiveUsers);

  // Set up heartbeat
  usePresenceHeartbeat(user, pageId, cursorPositionRef);

  // Set up lifecycle management
  usePresenceLifecycle(user, pageId, cursorPositionRef);

  // Initial fetch
  useEffect(() => {
    handleFetchActiveUsers();
  }, [handleFetchActiveUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (user && pageId) {
        cleanupPresence(user, pageId);
      }
    };
  }, [user, pageId, cleanup]);

  return {
    activeUsers,
    loading,
    updateCursorPosition: handleUpdateCursorPosition,
    sendHeartbeat: handleSendHeartbeat,
  };
}
