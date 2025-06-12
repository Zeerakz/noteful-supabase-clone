
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamMember {
  id: string;
  name: string;
  avatar_url?: string;
}

interface TeamMembersDisplayProps {
  value: string | null;
  maxVisible?: number;
}

export function TeamMembersDisplay({ value, maxVisible = 3 }: TeamMembersDisplayProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  try {
    // Parse the team members data (could be JSON array or comma-separated IDs/names)
    let members: TeamMember[] = [];
    
    if (value.startsWith('[') || value.startsWith('{')) {
      // JSON format
      members = JSON.parse(value);
    } else {
      // Comma-separated names
      members = value.split(',').map((name, index) => ({
        id: `member-${index}`,
        name: name.trim()
      }));
    }

    if (members.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }

    const visibleMembers = members.slice(0, maxVisible);
    const overflowCount = members.length - maxVisible;

    return (
      <div className="flex items-center -space-x-2">
        {visibleMembers.map((member) => (
          <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={member.avatar_url} alt={member.name} />
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflowCount > 0 && (
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border-2 border-background text-xs font-medium text-muted-foreground">
            +{overflowCount}
          </div>
        )}
      </div>
    );
  } catch (error) {
    // Fallback for invalid JSON or other parsing errors
    return <span className="text-muted-foreground">{value}</span>;
  }
}
