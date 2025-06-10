
import React from 'react';

interface UserCursorProps {
  userId: string;
  x: number;
  y: number;
  color?: string;
}

export function UserCursor({ userId, x, y, color = '#3b82f6' }: UserCursorProps) {
  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-100"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Cursor pointer */}
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 2L18 8L8 10L6 18L2 2Z"
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        </svg>
        
        {/* User identifier */}
        <div
          className="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          User {userId.slice(0, 8)}
        </div>
      </div>
    </div>
  );
}
