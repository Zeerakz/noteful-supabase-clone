-- Phase 1: Cleanup of old schema
-- Drop triggers and functions that depend on the old 'fields' table to avoid errors.
DROP TRIGGER IF EXISTS on_field_change_trigger ON public.fields;
DROP TRIGGER IF EXISTS on_page_database_change_trigger ON public.blocks;

DROP FUNCTION IF EXISTS public.handle_database_field_change();
DROP FUNCTION IF EXISTS public.handle_page_database_change();
DROP FUNCTION IF EXISTS public.remove_properties_from_page(uuid, uuid);
DROP FUNCTION IF EXISTS public.apply_properties_to_page(uuid, uuid, uuid);

-- Drop the old 'fields' table. CASCADE removes dependent objects like foreign keys.
DROP TABLE IF EXISTS public.fields CASCADE;

-- Drop old ENUM types to ensure a clean slate.
DROP TYPE IF EXISTS public.property_type_enum;
DROP TYPE IF EXISTS public.property_visibility;

-- Phase 2: Create the new, structured schema

-- 1. Create a reusable ENUM type for property visibility settings.
CREATE TYPE public.property_visibility AS ENUM (
  'always_show',
  'always_hide',
  'show_when_not_empty'
);

-- 2. Create a reusable ENUM for all supported property types for data integrity.
CREATE TYPE public.property_type_enum AS ENUM (
  'text',
  'number',
  'select',
  'multi_select',
  'status',
  'date',
  'people',
  'file_attachment',
  'checkbox',
  'url',
  'email',
  'phone',
  'relation',
  'rollup',
  'formula',
  'button',
  'image',
  'created_time',
  'created_by',
  'last_edited_time',
  'last_edited_by',
  'id',
  'datetime',
  'rich_text',
  'rating',
  'progress',
  'currency'
);

-- 3. Create the new 'fields' table with the correct structure.
CREATE TABLE public.fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  database_id uuid NOT NULL,
  name text NOT NULL,
  type public.property_type_enum NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  pos integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  visibility_setting public.property_visibility DEFAULT 'show_when_not_empty',
  CONSTRAINT fields_pkey PRIMARY KEY (id),
  CONSTRAINT fields_database_id_fkey FOREIGN KEY (database_id) REFERENCES public.databases(id) ON DELETE CASCADE,
  CONSTRAINT fields_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. Create an index for faster lookups.
CREATE INDEX IF NOT EXISTS idx_fields_database_id ON public.fields(database_id);

-- 5. Re-add the foreign key to 'page_properties' that was removed by CASCADE.
ALTER TABLE public.page_properties 
  ADD CONSTRAINT page_properties_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE CASCADE;

-- Phase 3: Recreate property inheritance system

-- Function to apply properties from a database to a page
CREATE OR REPLACE FUNCTION public.apply_properties_to_page(p_page_id uuid, p_database_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  field_record RECORD;
BEGIN
  FOR field_record IN
    SELECT id, settings->>'defaultValue' as default_val FROM public.fields WHERE database_id = p_database_id
  LOOP
    INSERT INTO public.page_properties (page_id, field_id, value, created_by)
    VALUES (p_page_id, field_record.id, COALESCE(field_record.default_val, ''), p_user_id)
    ON CONFLICT (page_id, field_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove properties from a page when its database link is removed
CREATE OR REPLACE FUNCTION public.remove_properties_from_page(p_page_id uuid, p_database_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM public.page_properties
  WHERE page_id = p_page_id
  AND field_id IN (SELECT id FROM public.fields WHERE database_id = p_database_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to handle when a page is moved between databases
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

  IF new_db_id IS NOT NULL AND old_db_id IS DISTINCT FROM new_db_id THEN
    IF old_db_id IS NOT NULL THEN
      PERFORM public.remove_properties_from_page(NEW.id, old_db_id);
    END IF;
    PERFORM public.apply_properties_to_page(NEW.id, new_db_id, page_creator_id);
  ELSIF new_db_id IS NULL AND old_db_id IS NOT NULL THEN
    PERFORM public.remove_properties_from_page(NEW.id, old_db_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attaching the trigger to the 'blocks' table
CREATE TRIGGER on_page_database_change_trigger
AFTER UPDATE ON public.blocks
FOR EACH ROW
WHEN (OLD.type = 'page' AND NEW.type = 'page' AND OLD.properties->>'database_id' IS DISTINCT FROM NEW.properties->>'database_id')
EXECUTE FUNCTION public.handle_page_database_change();

-- Trigger function to add/remove properties from pages when a database schema changes
CREATE OR REPLACE FUNCTION public.handle_database_field_change()
RETURNS TRIGGER AS $$
DECLARE
  page_record RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- A new field was added to a database
    FOR page_record IN
      SELECT id FROM public.blocks WHERE type = 'page' AND (properties->>'database_id')::uuid = NEW.database_id
    LOOP
      -- Add the corresponding property to all pages in that database
      INSERT INTO public.page_properties (page_id, field_id, value, created_by)
      VALUES (page_record.id, NEW.id, COALESCE(NEW.settings->>'defaultValue', ''), NEW.created_by)
      ON CONFLICT (page_id, field_id) DO NOTHING;
    END LOOP;
  ELSIF TG_OP = 'DELETE' THEN
    -- A field was removed from a database, so delete the corresponding property from all pages
    DELETE FROM public.page_properties WHERE field_id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attaching the trigger to the new 'fields' table
CREATE TRIGGER on_field_change_trigger
AFTER INSERT OR DELETE ON public.fields
FOR EACH ROW
EXECUTE FUNCTION public.handle_database_field_change();
