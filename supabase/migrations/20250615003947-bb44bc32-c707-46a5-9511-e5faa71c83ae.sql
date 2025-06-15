
-- Phase 1: Enhanced Property Storage Schema

-- 1. Create a reusable ENUM type for visibility settings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_visibility') THEN
        CREATE TYPE public.property_visibility AS ENUM ('always_show', 'always_hide', 'show_when_not_empty');
    END IF;
END$$;

-- 2. Add visibility_setting to the `fields` table to store the default visibility for a property
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS visibility_setting public.property_visibility NOT NULL DEFAULT 'show_when_not_empty';

-- 3. Add new columns to the `page_properties` table for overrides and metadata
ALTER TABLE public.page_properties ADD COLUMN IF NOT EXISTS visibility_setting public.property_visibility;
ALTER TABLE public.page_properties ADD COLUMN IF NOT EXISTS field_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.page_properties ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 4. Add an index to the computed_value column for performance
CREATE INDEX IF NOT EXISTS idx_page_properties_computed_value ON public.page_properties(computed_value);

-- 5. Create functions and triggers for property inheritance

-- Function to apply properties from a database to a single page
CREATE OR REPLACE FUNCTION public.apply_properties_to_page(p_page_id uuid, p_database_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  field_record RECORD;
BEGIN
  FOR field_record IN
    SELECT id FROM public.fields WHERE database_id = p_database_id
  LOOP
    -- Insert a new property for the page, letting defaults for new columns take effect.
    -- The application layer can provide more specific default values if needed.
    INSERT INTO public.page_properties (page_id, field_id, value, created_by)
    VALUES (p_page_id, field_record.id, '', p_user_id)
    ON CONFLICT (page_id, field_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove database-specific properties from a page
CREATE OR REPLACE FUNCTION public.remove_properties_from_page(p_page_id uuid, p_database_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM public.page_properties
  WHERE page_id = p_page_id
  AND field_id IN (SELECT id FROM public.fields WHERE database_id = p_database_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to handle when a page's database assignment changes
CREATE OR REPLACE FUNCTION public.handle_page_database_change()
RETURNS TRIGGER AS $$
DECLARE
  old_db_id uuid;
  new_db_id uuid;
  page_creator_id uuid;
BEGIN
  old_db_id := (OLD.properties->>'database_id')::uuid;
  new_db_id := (NEW.properties->>'database_id')::uuid;
  page_creator_id := NEW.created_by;

  -- This handles moving a page into, out of, or between databases
  IF new_db_id IS NOT NULL AND old_db_id IS DISTINCT FROM new_db_id THEN
    -- If page was in another DB, remove its old properties first
    IF old_db_id IS NOT NULL THEN
      PERFORM public.remove_properties_from_page(NEW.id, old_db_id);
    END IF;
    -- Apply properties from the new database
    PERFORM public.apply_properties_to_page(NEW.id, new_db_id, page_creator_id);
  ELSIF new_db_id IS NULL AND old_db_id IS NOT NULL THEN
    -- Page moved out of a database
    PERFORM public.remove_properties_from_page(NEW.id, old_db_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on the 'blocks' table to fire when a page's database_id changes
DROP TRIGGER IF EXISTS on_page_database_change_trigger ON public.blocks;
CREATE TRIGGER on_page_database_change_trigger
AFTER UPDATE ON public.blocks
FOR EACH ROW
WHEN (OLD.type = 'page' AND NEW.type = 'page' AND OLD.properties->>'database_id' IS DISTINCT FROM NEW.properties->>'database_id')
EXECUTE FUNCTION public.handle_page_database_change();

-- Trigger function to handle when a field is added to or removed from a database schema
CREATE OR REPLACE FUNCTION public.handle_database_field_change()
RETURNS TRIGGER AS $$
DECLARE
  page_record RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Field added: Add a corresponding property to all pages in that database
    FOR page_record IN
      SELECT id FROM public.blocks WHERE type = 'page' AND (properties->>'database_id')::uuid = NEW.database_id
    LOOP
      INSERT INTO public.page_properties (page_id, field_id, value, created_by)
      VALUES (page_record.id, NEW.id, '', NEW.created_by)
      ON CONFLICT (page_id, field_id) DO NOTHING;
    END LOOP;
  ELSIF TG_OP = 'DELETE' THEN
    -- Field removed: Delete the corresponding property from all pages
    DELETE FROM public.page_properties WHERE field_id = OLD.id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on the 'fields' table to sync changes with all pages
DROP TRIGGER IF EXISTS on_field_change_trigger ON public.fields;
CREATE TRIGGER on_field_change_trigger
AFTER INSERT OR DELETE ON public.fields
FOR EACH ROW
EXECUTE FUNCTION public.handle_database_field_change();

