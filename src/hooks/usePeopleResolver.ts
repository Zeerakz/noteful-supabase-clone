
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ResolvedUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  isGuest?: boolean;
}

export function usePeopleResolver() {
  const resolveUsers = useCallback(async (userIds: string[]): Promise<ResolvedUser[]> => {
    if (!userIds.length) return [];

    const resolvedUsers: ResolvedUser[] = [];
    const actualUserIds: string[] = [];
    const guestUsers: ResolvedUser[] = [];

    // Separate guest users from actual users
    userIds.forEach(id => {
      if (id.startsWith('guest_')) {
        // Extract email from guest ID (assuming format: guest_timestamp_email)
        const parts = id.split('_');
        if (parts.length >= 3) {
          const email = parts.slice(2).join('_');
          guestUsers.push({
            id,
            email,
            name: email,
            isGuest: true
          });
        }
      } else {
        actualUserIds.push(id);
      }
    });

    // Resolve actual users from database
    if (actualUserIds.length > 0) {
      try {
        // Query the profiles table directly since the workspace_membership join has issues
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', actualUserIds);

        if (error) {
          console.error('Error resolving users:', error);
        } else if (profiles) {
          const dbUsers = profiles.map(profile => ({
            id: profile.id,
            email: profile.email || 'Unknown user',
            name: profile.full_name,
            avatar_url: profile.avatar_url,
            isGuest: false
          }));
          resolvedUsers.push(...dbUsers);
        }

        // Add placeholder for any unresolved user IDs
        const resolvedIds = resolvedUsers.map(u => u.id);
        actualUserIds.forEach(id => {
          if (!resolvedIds.includes(id)) {
            resolvedUsers.push({
              id,
              email: 'Unknown user',
              name: 'Unknown user',
              isGuest: false
            });
          }
        });
      } catch (error) {
        console.error('Error resolving users:', error);
      }
    }

    // Combine all users and maintain order
    const allUsers = [...resolvedUsers, ...guestUsers];
    return userIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as ResolvedUser[];
  }, []);

  return {
    resolveUsers,
    isLoading: false // Since this is a synchronous resolution for cached data
  };
}
