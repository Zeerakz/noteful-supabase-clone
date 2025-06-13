
import { supabase } from '@/integrations/supabase/client';
import { SchemaAuditLog, BreakingChange } from '@/types/schemaAudit';

export class SchemaAuditService {
  static async getAuditLogs(databaseId: string, limit = 50): Promise<{ data: SchemaAuditLog[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('schema_audit_log')
        .select('*')
        .eq('database_id', databaseId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data as SchemaAuditLog[] | null, error: error?.message || null };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch audit logs' };
    }
  }

  static async getWorkspaceAuditLogs(workspaceId: string, limit = 100): Promise<{ data: SchemaAuditLog[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('schema_audit_log')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data as SchemaAuditLog[] | null, error: error?.message || null };
    } catch (error) {
      console.error('Error fetching workspace audit logs:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch workspace audit logs' };
    }
  }

  // Helper function to normalize field names for comparison
  private static normalizeFieldName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  // Helper function to check if a name change is just cosmetic
  private static isCosmeticNameChange(oldName: string, newName: string): boolean {
    const normalizedOld = this.normalizeFieldName(oldName);
    const normalizedNew = this.normalizeFieldName(newName);
    return normalizedOld === normalizedNew;
  }

  // Configuration for what constitutes a breaking change
  private static getBreakingChangeConfig() {
    return {
      // Grace period for newly created fields (in hours)
      newFieldGracePeriod: 24,
      // Minimum field age to consider deletion as breaking (in hours)
      minFieldAgeForBreaking: 24,
      // Consider recent activity when determining if change is breaking
      considerRecentActivity: true,
    };
  }

  // Check if a field was recently created
  private static isRecentlyCreatedField(fieldId: string, auditLogs: SchemaAuditLog[]): boolean {
    const config = this.getBreakingChangeConfig();
    const gracePeriodMs = config.newFieldGracePeriod * 60 * 60 * 1000; // Convert hours to ms
    
    // Find the creation log for this field
    const creationLog = auditLogs.find(log => 
      log.field_id === fieldId && 
      log.change_type === 'field_created'
    );
    
    if (!creationLog) {
      // If we can't find creation log, assume it's old (safer to flag as breaking)
      return false;
    }
    
    const createdAt = new Date(creationLog.created_at);
    const now = new Date();
    const timeSinceCreation = now.getTime() - createdAt.getTime();
    
    return timeSinceCreation < gracePeriodMs;
  }

  // Check if field deletion occurred shortly after creation (same session/day)
  private static isQuickDeletion(deletionLog: SchemaAuditLog, auditLogs: SchemaAuditLog[]): boolean {
    const config = this.getBreakingChangeConfig();
    const sameDayThreshold = 8 * 60 * 60 * 1000; // 8 hours in ms
    
    if (!deletionLog.field_id) return false;
    
    // Find the creation log for this field
    const creationLog = auditLogs.find(log => 
      log.field_id === deletionLog.field_id && 
      log.change_type === 'field_created'
    );
    
    if (!creationLog) return false;
    
    const createdAt = new Date(creationLog.created_at);
    const deletedAt = new Date(deletionLog.created_at);
    const timeBetween = deletedAt.getTime() - createdAt.getTime();
    
    return timeBetween < sameDayThreshold;
  }

  // Check if there's been recent development activity suggesting active development
  private static hasRecentDevelopmentActivity(auditLogs: SchemaAuditLog[]): boolean {
    const recentActivityThreshold = 2 * 60 * 60 * 1000; // 2 hours in ms
    const now = new Date();
    
    // Count recent field operations
    const recentOps = auditLogs.filter(log => {
      const logTime = new Date(log.created_at);
      return (now.getTime() - logTime.getTime()) < recentActivityThreshold;
    });
    
    // If there are multiple operations in a short time, it's likely active development
    return recentOps.length > 3;
  }

  // Enhanced analysis with intelligent filtering
  static analyzeBreakingChanges(auditLogs: SchemaAuditLog[]): BreakingChange[] {
    const breakingChanges: BreakingChange[] = [];
    const config = this.getBreakingChangeConfig();

    auditLogs.forEach(log => {
      if (log.change_type === 'field_deleted') {
        // Smart filtering for field deletions
        const isRecentField = this.isRecentlyCreatedField(log.field_id!, auditLogs);
        const isQuickDel = this.isQuickDeletion(log, auditLogs);
        const hasRecentActivity = this.hasRecentDevelopmentActivity(auditLogs);
        
        // Skip if this looks like normal development workflow
        if (isRecentField || isQuickDel) {
          console.log(`Skipping field deletion alert for "${log.old_values?.name}" - appears to be part of active development`);
          return; // Don't treat as breaking change
        }
        
        // If there's lots of recent activity, lower the severity
        const severity = hasRecentActivity ? 'medium' : 'high';
        
        breakingChanges.push({
          id: log.id,
          type: 'field_deleted',
          severity,
          description: `Field "${log.old_values?.name}" was deleted`,
          impact: 'API consumers using this field will receive errors. All references must be removed.',
          migration_guide: `Remove all references to field "${log.old_values?.name}" from your API calls and data models.`,
          created_at: log.created_at
        });
      } else if (log.change_type === 'field_renamed') {
        const oldName = log.old_values?.name;
        const newName = log.new_values?.name;
        
        // Only treat as breaking change if it's not just a cosmetic change
        if (oldName && newName && !this.isCosmeticNameChange(oldName, newName)) {
          // Check if this is a recently created field
          const isRecentField = this.isRecentlyCreatedField(log.field_id!, auditLogs);
          const severity = isRecentField ? 'low' : 'high';
          
          breakingChanges.push({
            id: log.id,
            type: 'field_renamed',
            severity,
            description: `Field renamed from "${oldName}" to "${newName}"`,
            impact: 'API consumers using the old field name will receive errors.',
            migration_guide: `Update all references from "${oldName}" to "${newName}" in your API calls and data models.`,
            created_at: log.created_at
          });
        }
      } else if (log.change_type === 'field_updated' && log.old_values?.type !== log.new_values?.type) {
        // Check if this is a recently created field
        const isRecentField = this.isRecentlyCreatedField(log.field_id!, auditLogs);
        const severity = isRecentField ? 'low' : 'medium';
        
        breakingChanges.push({
          id: log.id,
          type: 'type_changed',
          severity,
          description: `Field "${log.new_values?.name}" type changed from ${log.old_values?.type} to ${log.new_values?.type}`,
          impact: 'Data format expectations may be violated. Validation logic may need updates.',
          migration_guide: `Update data validation and processing logic to handle ${log.new_values?.type} format for field "${log.new_values?.name}".`,
          created_at: log.created_at
        });
      }
    });

    return breakingChanges.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async getBreakingChangesSince(databaseId: string, since: Date): Promise<{ data: BreakingChange[] | null; error: string | null }> {
    try {
      // Get more logs for better context and lifecycle analysis
      const { data: auditLogs, error } = await this.getAuditLogs(databaseId, 500);
      
      if (error || !auditLogs) {
        return { data: null, error };
      }

      // Filter logs to the requested timeframe for breaking change analysis
      const filteredLogs = auditLogs.filter(log => new Date(log.created_at) >= since);
      
      // But use all logs for context (to find field creation times, etc.)
      const breakingChanges = this.analyzeBreakingChanges(auditLogs);
      
      // Only return breaking changes that occurred in the requested timeframe
      const relevantBreakingChanges = breakingChanges.filter(change => 
        new Date(change.created_at) >= since
      );

      return { data: relevantBreakingChanges, error: null };
    } catch (error) {
      console.error('Error analyzing breaking changes:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to analyze breaking changes' };
    }
  }
}
