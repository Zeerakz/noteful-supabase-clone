import { useState, useEffect } from 'react';
import { BreakingChange } from '@/types/schemaAudit';
import { SchemaAuditService } from '@/services/schemaAuditService';

export function useBreakingChanges(databaseId: string | undefined) {
  const [breakingChanges, setBreakingChanges] = useState<BreakingChange[]>([]);
  const [loadingBreakingChanges, setLoadingBreakingChanges] = useState(true);
  const [dismissedChangeIds, setDismissedChangeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadBreakingChanges = async () => {
      if (!databaseId) return;
      
      setLoadingBreakingChanges(true);
      try {
        // Get breaking changes from the last 30 days to ensure we catch all relevant changes
        const since = new Date();
        since.setDate(since.getDate() - 30);
        
        const { data, error } = await SchemaAuditService.getBreakingChangesSince(databaseId, since);
        
        if (error) {
          console.error('Failed to load breaking changes:', error);
          setBreakingChanges([]);
        } else {
          // Filter out changes older than 7 days for display, but keep 30 days for analysis
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const recentBreakingChanges = (data || []).filter(change => 
            new Date(change.created_at) >= sevenDaysAgo
          );
          
          setBreakingChanges(recentBreakingChanges);
        }
      } catch (err) {
        console.error('Error loading breaking changes:', err);
        setBreakingChanges([]);
      } finally {
        setLoadingBreakingChanges(false);
      }
    };

    loadBreakingChanges();
  }, [databaseId]);

  const handleDismissBreakingChange = (changeId: string) => {
    setDismissedChangeIds(prev => new Set([...prev, changeId]));
  };

  const handleAcknowledgeAllBreakingChanges = () => {
    const allChangeIds = breakingChanges.map(change => change.id);
    setDismissedChangeIds(new Set(allChangeIds));
  };

  // Filter out dismissed changes
  const visibleBreakingChanges = breakingChanges.filter(change => 
    !dismissedChangeIds.has(change.id)
  );

  return {
    breakingChanges,
    loadingBreakingChanges,
    visibleBreakingChanges,
    handleDismissBreakingChange,
    handleAcknowledgeAllBreakingChanges
  };
}
