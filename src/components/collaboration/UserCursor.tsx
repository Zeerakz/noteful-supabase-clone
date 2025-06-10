
import React from 'react';
import { UserAvatar } from './UserAvatar';

interface UserCursorProps {
  userId: string;
  x: number;
  y: number;
  color?: string;
}

export function UserCursor({ userId, x, y, color = '#3b82f6' }: UserCursorProps) {
  return (
    <UserAvatar 
      userId={userId}
      x={x}
      y={y}
      color={color}
      showLabel={true}
    />
  );
}
