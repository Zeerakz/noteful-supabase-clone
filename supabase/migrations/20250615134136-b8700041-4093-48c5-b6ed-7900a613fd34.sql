
-- Update the function to create a database and its properties, using the correct table name 'database_properties'
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

-- Update the function to recalculate formula fields, using the correct table name
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
  -- In a production system, you would implement a proper formula parser
  result := 'Calculated: ' || formula_text;
  
  RETURN result;
END;
$function$;

-- Update the function to recalculate rollup fields, using the correct table name
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
  -- In a production system, you would implement proper aggregation logic
  result := 'Rollup (' || aggregation_type || '): 0';
  
  RETURN result;
END;
$function$;
