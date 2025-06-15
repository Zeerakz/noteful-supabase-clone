
import React from 'react';
import { UserAvatar } from './UserAvatar';
import { PresenceActivity } from '@/types/presence';

interface UserCursorProps {
  userId: string;
  x: number;
  y: number;
  color?: string;
  activity: PresenceActivity;
}

export function UserCursor({ userId, x, y, color = '#3b82f6', activity }: UserCursorProps) {
  return (
    <UserAvatar 
      userId={userId}
      x={x}
      y={y}
      color={color}
      showLabel={true}
      activity={activity}
    />
  );
}
