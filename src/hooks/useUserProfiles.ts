
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { errorHandler } from '@/utils/errorHandler';

export function useUserProfiles(workspaceId?: string) {
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (!workspaceId || !mountedRef.current) return;

      try {
        setLoading(true);
        setError(null);
        
        console.log('👥 Fetching user profiles for workspace:', workspaceId);
        
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');

        if (!mountedRef.current) return;

        if (error) {
          console.error('❌ Error fetching user profiles:', error);
          errorHandler.logError(error as Error, { context: 'profiles_fetch', workspaceId });
          setError('Failed to fetch user profiles');
        } else {
          console.log('✅ User profiles fetched:', profiles?.length || 0);
          setUserProfiles(profiles || []);
        }
      } catch (err) {
        console.error('💥 Error fetching user profiles:', err);
        errorHandler.logError(err as Error, { context: 'profiles_fetch_critical', workspaceId });
        if (mountedRef.current) {
          setError('Failed to fetch user profiles');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchUserProfiles();
  }, [workspaceId]);

  return {
    userProfiles,
    loading,
    error
  };
}
