
-- Reverting Phase 1: Enhanced Property Storage Schema

-- 1. Drop triggers that depend on the functions
DROP TRIGGER IF EXISTS on_field_change_trigger ON public.fields;
DROP TRIGGER IF EXISTS on_page_database_change_trigger ON public.blocks;

-- 2. Drop the functions used by triggers
DROP FUNCTION IF EXISTS public.handle_database_field_change();
DROP FUNCTION IF EXISTS public.handle_page_database_change();
DROP FUNCTION IF EXISTS public.remove_properties_from_page(uuid, uuid);

-- 3. Drop the index
DROP INDEX IF EXISTS public.idx_page_properties_computed_value;

-- 4. Drop columns from `page_properties`
ALTER TABLE public.page_properties DROP COLUMN IF EXISTS visibility_setting;
ALTER TABLE public.page_properties DROP COLUMN IF EXISTS field_order;
ALTER TABLE public.page_properties DROP COLUMN IF EXISTS metadata;

-- 5. Drop column from `fields`
ALTER TABLE public.fields DROP COLUMN IF EXISTS visibility_setting;

-- 6. Drop the ENUM type
DROP TYPE IF EXISTS public.property_visibility;
