
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
        // Query the workspace_membership table to get user profiles with roles
        const { data: memberships, error } = await supabase
          .from('workspace_membership')
          .select(`
            user_id,
            role_id,
            roles:role_id (role_name),
            profiles:user_id (
              id,
              email,
              full_name,
              avatar_url
            )
          `)
          .in('user_id', actualUserIds)
          .eq('status', 'accepted');

        if (error) {
          console.error('Error resolving users:', error);
        } else {
          const dbUsers = (memberships || [])
            .filter(membership => membership.profiles)
            .map(membership => ({
              id: membership.profiles.id,
              email: membership.profiles.email || 'Unknown user',
              name: membership.profiles.full_name,
              avatar_url: membership.profiles.avatar_url,
              role: membership.roles?.role_name,
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
