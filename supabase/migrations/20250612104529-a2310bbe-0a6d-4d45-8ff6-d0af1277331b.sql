
-- Create the create_database_with_fields RPC function
CREATE OR REPLACE FUNCTION public.create_database_with_fields(
  p_workspace_id uuid,
  p_user_id uuid,
  p_name text,
  p_description text DEFAULT NULL,
  p_fields jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  database_id uuid,
  database_name text,
  table_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Create field records if any provided
  FOR field_record IN SELECT * FROM jsonb_array_elements(p_fields)
  LOOP
    INSERT INTO public.fields (
      database_id,
      name,
      type,
      settings,
      pos,
      created_by
    ) VALUES (
      new_database_id,
      field_record->>'name',
      field_record->>'type',
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
$$;
