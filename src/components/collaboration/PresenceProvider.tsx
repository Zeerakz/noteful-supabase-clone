
import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { UserCursor } from './UserCursor';

interface ActiveUser {
  user_id: string;
  cursor?: {
    x: number;
    y: number;
    blockId?: string;
  };
  last_heartbeat: string;
}

interface PresenceContextType {
  activeUsers: ActiveUser[];
  loading: boolean;
  updateCursorPosition: (x: number, y: number, blockId?: string) => Promise<void>;
  sendHeartbeat: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

interface PresenceProviderProps {
  pageId?: string;
  children: React.ReactNode;
}

// Generate consistent colors for users
const getUserColor = (userId: string): string => {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];
  
  // Use a simple hash to consistently assign colors
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function PresenceProvider({ pageId, children }: PresenceProviderProps) {
  const { activeUsers, loading, updateCursorPosition, sendHeartbeat } = usePresence(pageId);
  const [cursorsVisible, setCursorsVisible] = useState(true);

  // Track mouse movement
  useEffect(() => {
    if (!pageId) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (cursorsVisible) {
        updateCursorPosition(event.clientX, event.clientY);
      }
    };

    // Throttle mouse movement updates
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledMouseMove = (event: MouseEvent) => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        handleMouseMove(event);
        throttleTimer = null;
      }, 100); // Update every 100ms
    };

    document.addEventListener('mousemove', throttledMouseMove);

    return () => {
      document.removeEventListener('mousemove', throttledMouseMove);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [pageId, updateCursorPosition, cursorsVisible]);

  const contextValue: PresenceContextType = {
    activeUsers,
    loading,
    updateCursorPosition,
    sendHeartbeat,
  };

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
      
      {/* Render user cursors */}
      {cursorsVisible && activeUsers.map((user) => 
        user.cursor ? (
          <UserCursor
            key={user.user_id}
            userId={user.user_id}
            x={user.cursor.x}
            y={user.cursor.y}
            color={getUserColor(user.user_id)}
          />
        ) : null
      )}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }
  return context;
}
