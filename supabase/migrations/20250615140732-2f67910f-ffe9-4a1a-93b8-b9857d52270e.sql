
-- This migration updates several database functions to use the correct table 'database_properties'
-- and the correct column 'property_id' in 'schema_audit_log', ensuring consistency.

-- Update the function to create a database and its properties
CREATE OR REPLACE FUNCTION public.create_database_with_fields(p_workspace_id uuid, p_user_id uuid, p_name text, p_description text DEFAULT NULL::text, p_fields jsonb DEFAULT '[]'::jsonb)
 RETURNS TABLE(database_id uuid, database_name text, table_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_database_id uuid;
  new_table_name text;
  field_record jsonb;
  field_index int := 0;
BEGIN
  -- Generate table name from database name
  new_table_name := 'db_' || lower(regexp_replace(p_name, '[^a-zA-Z0-9_]', '_', 'g'));
  
  -- Create database record
  INSERT INTO public.databases (
    workspace_id,
    name,
    table_name,
    description,
    created_by
  ) VALUES (
    p_workspace_id,
    p_name,
    new_table_name,
    p_description,
    p_user_id
  ) RETURNING id INTO new_database_id;
  
  -- Create property records if any provided
  FOR field_record IN SELECT * FROM jsonb_array_elements(p_fields)
  LOOP
    INSERT INTO public.database_properties (
      database_id,
      name,
      type,
      settings,
      pos,
      created_by
    ) VALUES (
      new_database_id,
      field_record->>'name',
      (field_record->>'type')::public.property_type_enum,
      COALESCE(field_record->'settings', '{}'::jsonb),
      field_index,
      p_user_id
    );
    
    field_index := field_index + 1;
  END LOOP;
  
  -- Return the created database info
  RETURN QUERY
  SELECT 
    new_database_id as database_id,
    p_name as database_name,
    new_table_name as table_name;
END;
$function$;

-- Update the function to recalculate formula fields
CREATE OR REPLACE FUNCTION public.recalculate_formula_field(field_id uuid, page_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  field_settings JSONB;
  formula_text TEXT;
  result TEXT;
BEGIN
  -- Get the formula from field settings
  SELECT settings INTO field_settings
  FROM public.database_properties
  WHERE id = field_id AND type = 'formula';
  
  IF field_settings IS NULL THEN
    RETURN NULL;
  END IF;
  
  formula_text := field_settings->>'formula';
  
  -- For now, return a placeholder result
  result := 'Calculated: ' || formula_text;
  
  RETURN result;
END;
$function$;

-- Update the function to recalculate rollup fields
CREATE OR REPLACE FUNCTION public.recalculate_rollup_field(field_id uuid, page_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  field_settings JSONB;
  aggregation_type TEXT;
  result TEXT;
BEGIN
  -- Get the rollup settings from field
  SELECT settings INTO field_settings
  FROM public.database_properties
  WHERE id = field_id AND type = 'rollup';
  
  IF field_settings IS NULL THEN
    RETURN NULL;
  END IF;
  
  aggregation_type := field_settings->>'aggregation';
  
  -- For now, return a placeholder result
  result := 'Rollup (' || aggregation_type || '): 0';
  
  RETURN result;
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
  IF TG_OP = 'INSERT' THEN
    change_type_val := 'database_created';
    old_vals := NULL;
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    change_type_val := 'database_deleted';
    old_vals := to_jsonb(OLD);
    new_vals := NULL;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.schema_audit_log (
    database_id,
    property_id,
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
    jsonb_build_object('operation', TG_OP, 'table_name', TG_TABLE_NAME, 'timestamp', NOW())
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update the function to log field (property) schema changes
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
  SELECT d.workspace_id INTO workspace_uuid
  FROM public.databases d
  WHERE d.id = COALESCE(NEW.database_id, OLD.database_id);

  IF TG_OP = 'INSERT' THEN
    change_type_val := 'field_created';
    old_vals := NULL;
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
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

  INSERT INTO public.schema_audit_log (
    database_id,
    property_id,
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
    jsonb_build_object('operation', TG_OP, 'table_name', TG_TABLE_NAME, 'timestamp', NOW())
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

