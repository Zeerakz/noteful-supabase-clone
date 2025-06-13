
-- Create audit table for schema changes
CREATE TABLE public.schema_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID NOT NULL REFERENCES public.databases(id) ON DELETE CASCADE,
  field_id UUID, -- NULL for database-level changes
  change_type TEXT NOT NULL CHECK (change_type IN ('field_created', 'field_updated', 'field_deleted', 'field_renamed', 'database_created', 'database_deleted')),
  old_values JSONB, -- Previous state of the field/database
  new_values JSONB, -- New state of the field/database
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Additional context like migration info, API version, etc.
);

-- Enable RLS on schema_audit_log table
ALTER TABLE public.schema_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view audit logs in their workspaces
CREATE POLICY "Users can view schema audit logs in accessible workspaces" ON public.schema_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = schema_audit_log.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

-- Create policy for system to insert audit logs
CREATE POLICY "System can insert schema audit logs" ON public.schema_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Will be controlled by triggers

-- Create indexes for better performance
CREATE INDEX idx_schema_audit_log_database_id ON public.schema_audit_log(database_id);
CREATE INDEX idx_schema_audit_log_workspace_id ON public.schema_audit_log(workspace_id);
CREATE INDEX idx_schema_audit_log_created_at ON public.schema_audit_log(created_at);
CREATE INDEX idx_schema_audit_log_change_type ON public.schema_audit_log(change_type);

-- Create trigger function to log field changes
CREATE OR REPLACE FUNCTION public.log_field_schema_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  workspace_uuid UUID;
  change_type_val TEXT;
  old_vals JSONB;
  new_vals JSONB;
BEGIN
  -- Get workspace_id from the database
  SELECT d.workspace_id INTO workspace_uuid
  FROM public.databases d
  WHERE d.id = COALESCE(NEW.database_id, OLD.database_id);

  -- Determine change type and values
  IF TG_OP = 'INSERT' THEN
    change_type_val := 'field_created';
    old_vals := NULL;
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if name changed (rename)
    IF OLD.name != NEW.name THEN
      change_type_val := 'field_renamed';
    ELSE
      change_type_val := 'field_updated';
    END IF;
    old_vals := to_jsonb(OLD);
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    change_type_val := 'field_deleted';
    old_vals := to_jsonb(OLD);
    new_vals := NULL;
  END IF;

  -- Insert audit log
  INSERT INTO public.schema_audit_log (
    database_id,
    field_id,
    change_type,
    old_values,
    new_values,
    changed_by,
    workspace_id,
    metadata
  ) VALUES (
    COALESCE(NEW.database_id, OLD.database_id),
    COALESCE(NEW.id, OLD.id),
    change_type_val,
    old_vals,
    new_vals,
    COALESCE(NEW.created_by, OLD.created_by),
    workspace_uuid,
    jsonb_build_object(
      'operation', TG_OP,
      'table_name', TG_TABLE_NAME,
      'timestamp', NOW()
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger function to log database changes
CREATE OR REPLACE FUNCTION public.log_database_schema_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  change_type_val TEXT;
  old_vals JSONB;
  new_vals JSONB;
BEGIN
  -- Determine change type and values
  IF TG_OP = 'INSERT' THEN
    change_type_val := 'database_created';
    old_vals := NULL;
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    change_type_val := 'database_deleted';
    old_vals := to_jsonb(OLD);
    new_vals := NULL;
  ELSE
    -- Skip updates for now (name changes are typically not breaking)
    RETURN NEW;
  END IF;

  -- Insert audit log
  INSERT INTO public.schema_audit_log (
    database_id,
    field_id,
    change_type,
    old_values,
    new_values,
    changed_by,
    workspace_id,
    metadata
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    NULL,
    change_type_val,
    old_vals,
    new_vals,
    COALESCE(NEW.created_by, OLD.created_by),
    COALESCE(NEW.workspace_id, OLD.workspace_id),
    jsonb_build_object(
      'operation', TG_OP,
      'table_name', TG_TABLE_NAME,
      'timestamp', NOW()
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers on fields table
CREATE TRIGGER fields_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.fields
  FOR EACH ROW EXECUTE FUNCTION public.log_field_schema_changes();

-- Create triggers on databases table
CREATE TRIGGER databases_audit_trigger
  AFTER INSERT OR DELETE ON public.databases
  FOR EACH ROW EXECUTE FUNCTION public.log_database_schema_changes();

-- Create updated_at trigger for audit log
CREATE TRIGGER update_schema_audit_log_updated_at 
  BEFORE UPDATE ON public.schema_audit_log 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
