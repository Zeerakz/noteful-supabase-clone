
-- Update the function to log field/property schema changes
CREATE OR REPLACE FUNCTION public.log_field_schema_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    property_id, -- Fix: was field_id
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
$function$;

-- Update the function to log database schema changes
CREATE OR REPLACE FUNCTION public.log_database_schema_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    property_id, -- Fix: was field_id
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
$function$;
