
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PresenceActivity } from '@/types/presence';

interface UserAvatarProps {
  userId: string;
  x: number;
  y: number;
  color?: string;
  showLabel?: boolean;
  activity?: PresenceActivity;
}

export function UserAvatar({ userId, x, y, color = '#3b82f6', showLabel = true, activity = 'viewing' }: UserAvatarProps) {
  const initials = userId.slice(0, 2).toUpperCase();
  const activityLabel = activity.charAt(0).toUpperCase() + activity.slice(1);
  
  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-200 ease-out"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative flex items-center">
        {/* Avatar chip */}
        <Avatar 
          className="w-8 h-8 border-2 border-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          <AvatarFallback 
            className="text-white text-xs font-medium"
            style={{ backgroundColor: color }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Cursor pointer */}
        <div className="absolute -bottom-1 -right-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L11 5L5 6L4 11L1 1Z"
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        </div>
        
        {/* User label */}
        {showLabel && (
          <div
            className="absolute top-10 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
            style={{ backgroundColor: color }}
          >
            User {userId.slice(0, 8)} - {activityLabel}
          </div>
        )}
      </div>
    </div>
  );
}
