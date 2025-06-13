
import { useState, useEffect } from 'react';
import { SchemaAuditLog, BreakingChange } from '@/types/schemaAudit';
import { SchemaAuditService } from '@/services/schemaAuditService';

export function useSchemaAudit(databaseId: string) {
  const [auditLogs, setAuditLogs] = useState<SchemaAuditLog[]>([]);
  const [breakingChanges, setBreakingChanges] = useState<BreakingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!databaseId) return;

    const fetchAuditData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: logs, error: logsError } = await SchemaAuditService.getAuditLogs(databaseId);
        
        if (logsError) {
          setError(logsError);
          return;
        }

        if (logs) {
          setAuditLogs(logs);
          
          // Analyze breaking changes from the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentLogs = logs.filter(log => new Date(log.created_at) >= thirtyDaysAgo);
          const breakingChanges = SchemaAuditService.analyzeBreakingChanges(recentLogs);
          setBreakingChanges(breakingChanges);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit data');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [databaseId]);

  return {
    auditLogs,
    breakingChanges,
    loading,
    error,
    refetch: () => {
      if (databaseId) {
        const fetchAuditData = async () => {
          const { data: logs } = await SchemaAuditService.getAuditLogs(databaseId);
          if (logs) {
            setAuditLogs(logs);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentLogs = logs.filter(log => new Date(log.created_at) >= thirtyDaysAgo);
            const breakingChanges = SchemaAuditService.analyzeBreakingChanges(recentLogs);
            setBreakingChanges(breakingChanges);
          }
        };
        fetchAuditData();
      }
    }
  };
}
