
-- Step 1: Drop the old, incorrect foreign key constraint if it exists.
-- The name 'page_properties_page_id_fkey' suggests it's a leftover from an old table structure.
ALTER TABLE public.property_values DROP CONSTRAINT IF EXISTS page_properties_page_id_fkey;

-- Step 2: Add the new, correct foreign key constraint.
-- This ensures that property values are correctly linked to pages in the 'blocks' table.
-- ON DELETE CASCADE means that if a page is deleted, all its property values will be automatically removed too.
ALTER TABLE public.property_values
ADD CONSTRAINT property_values_page_id_fkey
FOREIGN KEY (page_id)
REFERENCES public.blocks(id)
ON DELETE CASCADE;
