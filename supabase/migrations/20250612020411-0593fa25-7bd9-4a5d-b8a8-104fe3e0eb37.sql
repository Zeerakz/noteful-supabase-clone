
-- Add new field types: formula and rollup
-- Formula fields compute values based on other fields in the same row
-- Rollup fields aggregate values from related database entries

-- First, let's add the new field types to the existing fields table
-- We'll use the settings JSONB column to store configuration for these complex field types

-- For Formula fields, the settings will contain:
-- {
--   "formula": "field1 + field2", 
--   "return_type": "number|text|date|boolean",
--   "referenced_fields": ["field_id_1", "field_id_2"]
-- }

-- For Rollup fields, the settings will contain:
-- {
--   "relation_field_id": "uuid_of_relation_field",
--   "rollup_property": "field_id_to_aggregate", 
--   "aggregation": "sum|count|average|min|max|earliest|latest",
--   "target_database_id": "uuid_of_target_database"
-- }

-- Add computed_value column to page_properties to store calculated results
-- This separates user input (value) from computed results (computed_value)
ALTER TABLE public.page_properties 
ADD COLUMN computed_value TEXT;

-- Add indexes for better performance on computed values
CREATE INDEX idx_page_properties_computed_value ON public.page_properties(computed_value);

-- Create a function to validate formula field settings
CREATE OR REPLACE FUNCTION validate_formula_field_settings(settings JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if required formula settings exist
  IF settings ? 'formula' AND settings ? 'return_type' THEN
    -- Validate return_type is one of the allowed values
    IF settings->>'return_type' IN ('number', 'text', 'date', 'boolean') THEN
      RETURN TRUE;
    END IF;
  END IF;
  RETURN FALSE;
END;
$$;

-- Create a function to validate rollup field settings
CREATE OR REPLACE FUNCTION validate_rollup_field_settings(settings JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if required rollup settings exist
  IF settings ? 'relation_field_id' AND 
     settings ? 'rollup_property' AND 
     settings ? 'aggregation' AND
     settings ? 'target_database_id' THEN
    -- Validate aggregation is one of the allowed values
    IF settings->>'aggregation' IN ('sum', 'count', 'average', 'min', 'max', 'earliest', 'latest') THEN
      RETURN TRUE;
    END IF;
  END IF;
  RETURN FALSE;
END;
$$;

-- Create a trigger function to validate field settings based on type
CREATE OR REPLACE FUNCTION validate_field_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate settings for formula fields
  IF NEW.type = 'formula' THEN
    IF NOT validate_formula_field_settings(NEW.settings) THEN
      RAISE EXCEPTION 'Invalid formula field settings. Required: formula, return_type';
    END IF;
  END IF;
  
  -- Validate settings for rollup fields
  IF NEW.type = 'rollup' THEN
    IF NOT validate_rollup_field_settings(NEW.settings) THEN
      RAISE EXCEPTION 'Invalid rollup field settings. Required: relation_field_id, rollup_property, aggregation, target_database_id';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate field settings on insert/update
CREATE TRIGGER validate_field_settings_trigger
  BEFORE INSERT OR UPDATE ON public.fields
  FOR EACH ROW
  EXECUTE FUNCTION validate_field_settings();

-- Create a table to track field dependencies for formula fields
CREATE TABLE public.field_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  dependent_field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate dependencies
  UNIQUE(source_field_id, dependent_field_id)
);

-- Enable RLS on field_dependencies table
ALTER TABLE public.field_dependencies ENABLE ROW LEVEL SECURITY;

-- Create policy for field dependencies (users can view dependencies for fields they have access to)
CREATE POLICY "Users can view field dependencies in accessible workspaces" 
ON public.field_dependencies
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fields f
    JOIN public.databases d ON f.database_id = d.id
    WHERE f.id = field_dependencies.source_field_id
    AND d.created_by = auth.uid()
  )
);

-- Create policy for creating field dependencies
CREATE POLICY "Users can create field dependencies" 
ON public.field_dependencies
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fields f
    JOIN public.databases d ON f.database_id = d.id
    WHERE f.id = field_dependencies.source_field_id
    AND d.created_by = auth.uid()
  )
);

-- Create policy for deleting field dependencies
CREATE POLICY "Users can delete field dependencies" 
ON public.field_dependencies
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fields f
    JOIN public.databases d ON f.database_id = d.id
    WHERE f.id = field_dependencies.source_field_id
    AND d.created_by = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_field_dependencies_source ON public.field_dependencies(source_field_id);
CREATE INDEX idx_field_dependencies_dependent ON public.field_dependencies(dependent_field_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_field_dependencies_updated_at 
  BEFORE UPDATE ON public.field_dependencies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to recalculate formula values
CREATE OR REPLACE FUNCTION recalculate_formula_field(
  field_id UUID,
  page_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  field_settings JSONB;
  formula_text TEXT;
  result TEXT;
BEGIN
  -- Get the formula from field settings
  SELECT settings INTO field_settings
  FROM public.fields
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
$$;

-- Create a function to recalculate rollup values
CREATE OR REPLACE FUNCTION recalculate_rollup_field(
  field_id UUID,
  page_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  field_settings JSONB;
  aggregation_type TEXT;
  result TEXT;
BEGIN
  -- Get the rollup settings from field
  SELECT settings INTO field_settings
  FROM public.fields
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
$$;
