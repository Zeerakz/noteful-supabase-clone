
export interface SchemaAuditLog {
  id: string;
  database_id: string;
  field_id?: string;
  change_type: 'field_created' | 'field_updated' | 'field_deleted' | 'field_renamed' | 'database_created' | 'database_deleted';
  old_values?: any;
  new_values?: any;
  changed_by: string;
  workspace_id: string;
  created_at: string;
  metadata?: any;
}

export interface BreakingChange {
  id: string;
  type: 'field_deleted' | 'field_renamed' | 'type_changed';
  severity: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  migration_guide?: string;
  created_at: string;
  // Enhanced metadata for better tracking
  is_development_change?: boolean;
  field_age_hours?: number;
  auto_dismissible?: boolean;
}
