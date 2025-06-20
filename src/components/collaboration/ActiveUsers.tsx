import React from 'react';
import { Users, Eye, MessageSquare, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PresenceActivity } from '@/types/presence';

interface ActiveUser {
  user_id: string;
  cursor?: {
    x: number;
    y: number;
    blockId?: string;
  };
  activity: PresenceActivity;
  last_heartbeat: string;
}

interface ActiveUsersProps {
  activeUsers: ActiveUser[];
  loading?: boolean;
}

// Generate consistent colors for users (same as PresenceProvider)
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
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ActivityIcon = ({ activity }: { activity: PresenceActivity }) => {
    switch (activity) {
      case 'editing': return <Edit3 className="h-3 w-3 text-gray-600" />;
      case 'commenting': return <MessageSquare className="h-3 w-3 text-gray-600" />;
      default: return <Eye className="h-3 w-3 text-gray-600" />;
    }
};

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
        {activeUsers.slice(0, 3).map((user, index) => {
          const userColor = getUserColor(user.user_id);
          const initials = user.user_id.slice(0, 2).toUpperCase();
          
          return (
            <Avatar
              key={user.user_id}
              className="w-6 h-6 border-2 border-white relative"
              style={{
                zIndex: 10 - index,
                backgroundColor: userColor,
              }}
              title={`User ${user.user_id.slice(0, 8)} (${user.activity})`}
            >
              <AvatarFallback 
                className="text-xs text-white font-medium"
                style={{ backgroundColor: userColor }}
              >
                {initials}
              </AvatarFallback>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
                <ActivityIcon activity={user.activity} />
              </div>
            </Avatar>
          );
        })}
        
        {activeCount > 3 && (
          <Avatar className="w-6 h-6 border-2 border-white bg-gray-400">
            <AvatarFallback className="text-xs text-white font-medium bg-gray-400">
              +{activeCount - 3}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
