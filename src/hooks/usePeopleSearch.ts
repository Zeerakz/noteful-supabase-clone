
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchedUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  isGuest?: boolean;
}

export function usePeopleSearch(workspaceId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchedUser[]>([]);

  const searchUsers = useCallback(async (query: string, allowedRoles?: string[]) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // For large workspaces, we should implement pagination or server-side search
      // For now, we'll do a simple client-side search with limits
      let searchQuery = supabase
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
        .eq('status', 'accepted')
        .limit(50); // Limit results for performance

      if (workspaceId) {
        searchQuery = searchQuery.eq('workspace_id', workspaceId);
      }

      const { data: memberships, error } = await searchQuery;

      if (error) {
        console.error('Error searching users:', error);
        setResults([]);
        return;
      }

      // Filter and format results
      const filteredUsers = (memberships || [])
        .filter((membership: any) => {
          const profile = membership.profiles;
          if (!profile) return false;

          const searchTerm = query.toLowerCase();
          const matchesName = profile.full_name?.toLowerCase().includes(searchTerm);
          const matchesEmail = profile.email?.toLowerCase().includes(searchTerm);
          
          if (!matchesName && !matchesEmail) return false;

          // Filter by allowed roles if specified
          if (allowedRoles && allowedRoles.length > 0) {
            const userRole = membership.roles?.role_name;
            return allowedRoles.includes(userRole);
          }

          return true;
        })
        .map((membership: any) => ({
          id: membership.user_id,
          email: membership.profiles.email,
          name: membership.profiles.full_name,
          avatar_url: membership.profiles.avatar_url,
          role: membership.roles?.role_name,
          isGuest: false
        }));

      setResults(filteredUsers);
    } catch (error) {
      console.error('Error in people search:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  return {
    searchUsers,
    isLoading,
    results
  };
}
