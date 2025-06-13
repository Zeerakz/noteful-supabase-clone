
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PeoplePropertyConfig } from '@/types/property';
import { usePeopleResolver } from '@/hooks/usePeopleResolver';

interface PeopleFieldDisplayProps {
  value: any;
  config: PeoplePropertyConfig;
  field?: any;
  pageId?: string;
}

export function PeopleFieldDisplay({ value, config }: PeopleFieldDisplayProps) {
  const { resolveUsers, isLoading } = usePeopleResolver();
  const [users, setUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!value || value.trim() === '') {
      setUsers([]);
      return;
    }

    const userIds = config.allowMultiple 
      ? value.split(',').filter((id: string) => id.trim())
      : [value.trim()];

    resolveUsers(userIds).then(setUsers);
  }, [value, config.allowMultiple, resolveUsers]);

  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (config.allowMultiple) {
    return (
      <div className="flex flex-wrap gap-1">
        {users.map((user, index) => (
          <Badge key={user.id || index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
            <Avatar className="h-4 w-4">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback className="text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">{user.name || user.email}</span>
          </Badge>
        ))}
      </div>
    );
  }

  const user = users[0];
  if (!user) {
    return <span className="text-muted-foreground">Unknown user</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={user.avatar_url} alt={user.name} />
        <AvatarFallback className="text-xs">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm">{user.name || user.email}</span>
      {user.isGuest && (
        <Badge variant="outline" className="text-xs">Guest</Badge>
      )}
    </div>
  );
}
