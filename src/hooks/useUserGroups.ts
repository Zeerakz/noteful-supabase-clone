
import { useState, useEffect, useCallback } from 'react';
import { UserGroupService } from '@/services/userGroupService';
import { UserGroup } from '@/types/userGroup';

export function useUserGroups(workspaceId?: string) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await UserGroupService.getGroups(workspaceId);
      if (error) throw new Error(error);
      setGroups(data || []);
    } catch (error) {
      console.error('Failed to fetch user groups', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, refresh: fetchGroups };
}
