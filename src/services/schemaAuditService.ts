
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

      return { data, error: error?.message || null };
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

      return { data, error: error?.message || null };
    } catch (error) {
      console.error('Error fetching workspace audit logs:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch workspace audit logs' };
    }
  }

  static analyzeBreakingChanges(auditLogs: SchemaAuditLog[]): BreakingChange[] {
    const breakingChanges: BreakingChange[] = [];

    auditLogs.forEach(log => {
      if (log.change_type === 'field_deleted') {
        breakingChanges.push({
          id: log.id,
          type: 'field_deleted',
          severity: 'high',
          description: `Field "${log.old_values?.name}" was deleted`,
          impact: 'API consumers using this field will receive errors. All references must be removed.',
          migration_guide: `Remove all references to field "${log.old_values?.name}" from your API calls and data models.`,
          created_at: log.created_at
        });
      } else if (log.change_type === 'field_renamed') {
        breakingChanges.push({
          id: log.id,
          type: 'field_renamed',
          severity: 'high',
          description: `Field renamed from "${log.old_values?.name}" to "${log.new_values?.name}"`,
          impact: 'API consumers using the old field name will receive errors.',
          migration_guide: `Update all references from "${log.old_values?.name}" to "${log.new_values?.name}" in your API calls and data models.`,
          created_at: log.created_at
        });
      } else if (log.change_type === 'field_updated' && log.old_values?.type !== log.new_values?.type) {
        breakingChanges.push({
          id: log.id,
          type: 'type_changed',
          severity: 'medium',
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
      const { data: auditLogs, error } = await this.getAuditLogs(databaseId, 200);
      
      if (error || !auditLogs) {
        return { data: null, error };
      }

      const filteredLogs = auditLogs.filter(log => new Date(log.created_at) >= since);
      const breakingChanges = this.analyzeBreakingChanges(filteredLogs);

      return { data: breakingChanges, error: null };
    } catch (error) {
      console.error('Error analyzing breaking changes:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to analyze breaking changes' };
    }
  }
}
