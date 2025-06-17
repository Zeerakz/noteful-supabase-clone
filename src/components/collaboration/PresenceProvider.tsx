
import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { UserCursor } from './UserCursor';
import { PresenceActivity, CursorPosition } from '@/types/presence';

interface ActiveUser {
  user_id: string;
  cursor?: CursorPosition;
  activity: PresenceActivity;
  last_heartbeat: string;
}

interface PresenceContextType {
  activeUsers: ActiveUser[];
  loading: boolean;
  updateCursorPosition: (x: number, y: number, blockId?: string) => Promise<void>;
  updateActivity: (activity: PresenceActivity) => Promise<void>;
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
  const { activeUsers, loading, updateCursorPosition, sendHeartbeat, updateActivity } = usePresence(pageId);
  const [cursorsVisible, setCursorsVisible] = useState(true);

  // Track mouse movement with improved throttling
  useEffect(() => {
    if (!pageId) return;

    let lastUpdate = 0;
    const throttleDelay = 150; // Reduced frequency for better performance

    const handleMouseMove = (event: MouseEvent) => {
      if (!cursorsVisible) return;
      
      const now = Date.now();
      if (now - lastUpdate < throttleDelay) return;
      
      lastUpdate = now;
      updateCursorPosition(event.clientX, event.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [pageId, updateCursorPosition, cursorsVisible]);

  // Hide cursors when mouse leaves the window
  useEffect(() => {
    const handleMouseLeave = () => setCursorsVisible(false);
    const handleMouseEnter = () => setCursorsVisible(true);

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  const contextValue: PresenceContextType = {
    activeUsers,
    loading,
    updateCursorPosition,
    sendHeartbeat,
    updateActivity,
  };

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
      
      {/* Render user avatar chips at cursor positions */}
      {cursorsVisible && activeUsers.map((user) => 
        user.cursor ? (
          <UserCursor
            key={user.user_id}
            userId={user.user_id}
            x={user.cursor.x}
            y={user.cursor.y}
            color={getUserColor(user.user_id)}
            activity={user.activity}
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
