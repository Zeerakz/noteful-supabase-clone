
import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActiveUser {
  user_id: string;
  cursor?: {
    x: number;
    y: number;
    blockId?: string;
  };
  last_heartbeat: string;
}

interface ActiveUsersProps {
  activeUsers: ActiveUser[];
  loading?: boolean;
}

export function ActiveUsers({ activeUsers, loading }: ActiveUsersProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const activeCount = activeUsers.length;

  if (activeCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4" />
      <Badge variant="secondary" className="gap-1">
        {activeCount} {activeCount === 1 ? 'user' : 'users'} online
      </Badge>
      
      {/* Show user avatars */}
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map((user, index) => (
          <div
            key={user.user_id}
            className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-medium"
            title={`User ${user.user_id.slice(0, 8)}`}
            style={{
              zIndex: 10 - index,
            }}
          >
            {user.user_id.charAt(0).toUpperCase()}
          </div>
        ))}
        
        {activeCount > 3 && (
          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-xs text-white font-medium">
            +{activeCount - 3}
          </div>
        )}
      </div>
    </div>
  );
}
