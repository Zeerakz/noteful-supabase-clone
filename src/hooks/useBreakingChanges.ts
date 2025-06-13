
import { useState, useEffect } from 'react';
import { BreakingChange } from '@/types/schemaAudit';
import { SchemaAuditService } from '@/services/schemaAuditService';

export function useBreakingChanges(databaseId: string | undefined) {
  const [breakingChanges, setBreakingChanges] = useState<BreakingChange[]>([]);
  const [loadingBreakingChanges, setLoadingBreakingChanges] = useState(true);
  const [dismissedChangeIds, setDismissedChangeIds] = useState<Set<string>>(new Set());

  // Load dismissed changes from localStorage
  useEffect(() => {
    if (databaseId) {
      const savedDismissals = localStorage.getItem(`dismissed_breaking_changes_${databaseId}`);
      if (savedDismissals) {
        try {
          const parsedDismissals = JSON.parse(savedDismissals);
          setDismissedChangeIds(new Set(parsedDismissals));
        } catch (error) {
          console.error('Failed to parse dismissed breaking changes:', error);
        }
      }
    }
  }, [databaseId]);

  useEffect(() => {
    const loadBreakingChanges = async () => {
      if (!databaseId) return;
      
      setLoadingBreakingChanges(true);
      try {
        // Get breaking changes from the last 7 days only (reduced from 30 days)
        const since = new Date();
        since.setDate(since.getDate() - 7);
        
        const { data, error } = await SchemaAuditService.getBreakingChangesSince(databaseId, since);
        
        if (error) {
          console.error('Failed to load breaking changes:', error);
          setBreakingChanges([]);
        } else {
          setBreakingChanges(data || []);
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
    const newDismissedIds = new Set([...dismissedChangeIds, changeId]);
    setDismissedChangeIds(newDismissedIds);
    
    // Persist to localStorage
    if (databaseId) {
      localStorage.setItem(
        `dismissed_breaking_changes_${databaseId}`, 
        JSON.stringify(Array.from(newDismissedIds))
      );
    }
  };

  const handleAcknowledgeAllBreakingChanges = () => {
    const allChangeIds = breakingChanges.map(change => change.id);
    const newDismissedIds = new Set([...dismissedChangeIds, ...allChangeIds]);
    setDismissedChangeIds(newDismissedIds);
    
    // Persist to localStorage
    if (databaseId) {
      localStorage.setItem(
        `dismissed_breaking_changes_${databaseId}`, 
        JSON.stringify(Array.from(newDismissedIds))
      );
    }
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
