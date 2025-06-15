
-- Phase 1: Rename the table and its primary key
ALTER TABLE public.page_properties RENAME TO property_values;
ALTER INDEX page_properties_pkey RENAME TO property_values_pkey;

-- Phase 2: Rename foreign key constraints
-- Note: This assumes the constraint name follows the standard pattern from the previous migration.
ALTER TABLE public.property_values RENAME CONSTRAINT page_properties_property_id_fkey TO property_values_property_id_fkey;

-- Phase 3: Update functions that reference the old table name

-- Function to apply properties from a database to a new page
CREATE OR REPLACE FUNCTION public.apply_properties_to_page(p_page_id uuid, p_database_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  property_record RECORD;
BEGIN
  FOR property_record IN
    SELECT id, settings->>'defaultValue' as default_val FROM public.database_properties WHERE database_id = p_database_id
  LOOP
    INSERT INTO public.property_values (page_id, property_id, value, created_by)
    VALUES (p_page_id, property_record.id, COALESCE(property_record.default_val, ''), p_user_id)
    ON CONFLICT (page_id, property_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove properties when a page is unlinked from a database
CREATE OR REPLACE FUNCTION public.remove_properties_from_page(p_page_id uuid, p_database_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM public.property_values
  WHERE page_id = p_page_id
  AND property_id IN (SELECT id FROM public.database_properties WHERE database_id = p_database_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to add/remove properties when the database schema changes
CREATE OR REPLACE FUNCTION public.handle_database_property_change()
RETURNS TRIGGER AS $$
DECLARE
  page_record RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR page_record IN
      SELECT id FROM public.blocks WHERE type = 'page' AND (properties->>'database_id')::uuid = NEW.database_id
    LOOP
      INSERT INTO public.property_values (page_id, property_id, value, created_by)
      VALUES (page_record.id, NEW.id, COALESCE(NEW.settings->>'defaultValue', ''), NEW.created_by)
      ON CONFLICT (page_id, property_id) DO NOTHING;
    END LOOP;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.property_values WHERE property_id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
