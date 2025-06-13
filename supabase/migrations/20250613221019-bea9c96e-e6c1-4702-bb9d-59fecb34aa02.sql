
-- Drop the existing trigger
DROP TRIGGER IF EXISTS databases_audit_trigger ON public.databases;

-- Update the trigger function to handle BEFORE DELETE timing
CREATE OR REPLACE FUNCTION public.log_database_schema_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Insert audit log (this will happen BEFORE the actual deletion)
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

-- Create the new trigger with BEFORE timing for DELETE operations
-- Keep AFTER for INSERT to maintain consistency with existing behavior
CREATE TRIGGER databases_audit_trigger
  BEFORE DELETE ON public.databases
  FOR EACH ROW EXECUTE FUNCTION public.log_database_schema_changes();

-- Also create an AFTER INSERT trigger to maintain audit logging for database creation
CREATE TRIGGER databases_audit_insert_trigger
  AFTER INSERT ON public.databases
  FOR EACH ROW EXECUTE FUNCTION public.log_database_schema_changes();
