
-- This script provides a safe, non-destructive migration to the new property system.
-- It renames existing tables to preserve data and then adjusts the schema,
-- finally backfilling any missing property values for existing pages.

-- =================================================================
-- Step 1: Create required ENUM types if they don't exist
-- =================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_visibility') THEN
    CREATE TYPE public.property_visibility AS ENUM ('always_show', 'always_hide', 'show_when_not_empty');
    RAISE NOTICE 'Created ENUM type property_visibility.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type_enum') THEN
    CREATE TYPE public.property_type_enum AS ENUM (
      'text', 'number', 'select', 'multi_select', 'status', 'date', 'people',
      'file_attachment', 'checkbox', 'url', 'email', 'phone', 'relation',
      'rollup', 'formula', 'button', 'image', 'created_time', 'created_by',
      'last_edited_time', 'last_edited_by', 'id', 'datetime', 'rich_text',
      'rating', 'progress', 'currency'
    );
    RAISE NOTICE 'Created ENUM type property_type_enum.';
  END IF;
END $$;


-- =================================================================
-- Step 2: Safely migrate 'fields' to 'database_properties'
-- =================================================================
DO $$
BEGIN
  -- Check if the old 'fields' table exists and 'database_properties' does not.
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fields' AND table_schema = 'public') AND
     NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'database_properties' AND table_schema = 'public') THEN

    -- Rename the 'fields' table to 'database_properties'
    ALTER TABLE public.fields RENAME TO database_properties;
    RAISE NOTICE 'Renamed table "fields" to "database_properties".';

    -- Rename primary key constraint and indexes
    ALTER INDEX fields_pkey RENAME TO database_properties_pkey;
    ALTER INDEX idx_fields_database_id RENAME TO idx_database_properties_database_id;
    
    -- Rename the foreign key on page_properties (if it exists with the old name)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_properties_field_id_fkey') THEN
        ALTER TABLE public.page_properties RENAME CONSTRAINT page_properties_field_id_fkey TO property_values_property_id_fkey;
        RAISE NOTICE 'Renamed foreign key on page_properties.';
    END IF;
  
  END IF;
END $$;


-- =================================================================
-- Step 3: Align 'database_properties' schema with the latest design
-- =================================================================
-- Add 'visibility_setting' column if it doesn't exist
ALTER TABLE public.database_properties
  ADD COLUMN IF NOT EXISTS visibility_setting public.property_visibility DEFAULT 'show_when_not_empty';

-- Ensure 'type' column uses the ENUM. This will fail if existing text values are not in the ENUM.
-- Handle this carefully. For now, we assume values are compatible.
ALTER TABLE public.database_properties
  ALTER COLUMN type TYPE public.property_type_enum USING type::text::property_type_enum;

-- Ensure other columns like `settings` are jsonb and have defaults.
ALTER TABLE public.database_properties
  ALTER COLUMN settings SET DEFAULT '{}'::jsonb,
  ALTER COLUMN settings TYPE jsonb USING settings::jsonb;
  

-- =================================================================
-- Step 4: Safely migrate 'page_properties' to 'property_values'
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'page_properties' AND table_schema = 'public') AND
     NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'property_values' AND table_schema = 'public') THEN
     
     ALTER TABLE public.page_properties RENAME TO property_values;
     RAISE NOTICE 'Renamed table "page_properties" to "property_values".';
     
     ALTER INDEX page_properties_pkey RENAME TO property_values_pkey;
     
     IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_properties_property_id_fkey') THEN
       ALTER TABLE public.property_values RENAME CONSTRAINT page_properties_property_id_fkey TO property_values_property_id_fkey;
     END IF;
  END IF;
END $$;


-- =================================================================
-- Step 5: Backfill property values for all existing pages to ensure consistency
-- =================================================================
DO $$
DECLARE
  page_record RECORD;
  property_record RECORD;
  insert_count INT := 0;
BEGIN
  RAISE NOTICE 'Starting to backfill missing property values for existing pages...';

  -- Loop through all pages that belong to a database
  FOR page_record IN
    SELECT b.id as page_id, (b.properties->>'database_id')::uuid as db_id, b.created_by as user_id
    FROM public.blocks b
    WHERE b.type = 'page' AND b.properties->>'database_id' IS NOT NULL
  LOOP
    -- For each page, loop through all properties of its database
    FOR property_record IN
      SELECT dp.id as prop_id, dp.settings->>'defaultValue' as default_val
      FROM public.database_properties dp
      WHERE dp.database_id = page_record.db_id
    LOOP
      -- Insert a property_value record for the page and property if it doesn't exist.
      INSERT INTO public.property_values (page_id, property_id, value, created_by)
      VALUES (page_record.page_id, property_record.prop_id, COALESCE(property_record.default_val, ''), page_record.user_id)
      ON CONFLICT (page_id, property_id) DO NOTHING;
      
      GET DIAGNOSTICS insert_count = ROW_COUNT;
      
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Property value backfill complete.';
END;
$$;


-- =================================================================
-- Step 6: Ensure all triggers and functions are correctly defined for the new schema
-- =================================================================

-- Function to apply properties from a database to a new page
CREATE OR REPLACE FUNCTION public.apply_properties_to_page(p_page_id uuid, p_database_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
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
$$;

-- Trigger function to add/remove properties from pages when a database schema changes
CREATE OR REPLACE FUNCTION public.handle_database_property_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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
$$;
