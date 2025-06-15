
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TeamspaceService } from '@/services/teamspaceService';
import { DiscoverableTeamspace } from '@/types/teamspace';

export function useDiscoverTeamspaces(workspaceId: string) {
  const [teamspaces, setTeamspaces] = useState<DiscoverableTeamspace[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTeamspaces = useCallback(async () => {
    if (!user || !workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await TeamspaceService.getDiscoverableTeamspaces(workspaceId, user.id);
      if (error) throw new Error(error);
      setTeamspaces(data || []);
    } catch (error) {
      console.error('Failed to fetch discoverable teamspaces', error);
      setTeamspaces([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user]);

  useEffect(() => {
    fetchTeamspaces();
  }, [fetchTeamspaces]);

  return { teamspaces, loading, refresh: fetchTeamspaces };
}
```
