
-- Database Reset Plan Implementation (Corrected Version)
-- This addresses the trigger issue and cleans up duplicate workspaces

-- Step 1: Temporarily disable the update_updated_at_column trigger on problematic tables
-- Fixed query to properly get table names with triggers

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable the trigger on all tables that have it (corrected query)
    FOR r IN 
        SELECT n.nspname as schema_name, c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE t.tgname = 'update_updated_at_trigger'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DISABLE TRIGGER update_updated_at_trigger', r.schema_name, r.table_name);
    END LOOP;
END $$;

-- Step 2: Move all databases to the primary workspace
UPDATE public.databases 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

-- Step 3: Move all blocks (pages) to the primary workspace
UPDATE public.blocks 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

-- Step 4: Update other workspace references
UPDATE public.property_file_attachments 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

UPDATE public.files 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

UPDATE public.saved_database_views 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

UPDATE public.groups 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

UPDATE public.teamspaces 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

UPDATE public.templates 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

-- Step 5: Consolidate workspace members - move members from duplicate workspace
UPDATE public.workspace_members 
SET workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213'
AND user_id NOT IN (
  SELECT user_id FROM public.workspace_members 
  WHERE workspace_id = '7f0dfe2d-3389-41ab-88fe-af5baef0d714'
);

-- Step 6: Remove duplicate workspace members
DELETE FROM public.workspace_members 
WHERE workspace_id = '8ed232fe-343d-45d4-978c-9d755259d213';

-- Step 7: Remove the duplicate workspace
DELETE FROM public.workspaces 
WHERE id = '8ed232fe-343d-45d4-978c-9d755259d213';

-- Step 8: Clean up orphaned data
DELETE FROM public.property_values 
WHERE property_id NOT IN (SELECT id FROM public.database_properties);

DELETE FROM public.property_values 
WHERE page_id NOT IN (SELECT id FROM public.blocks WHERE type = 'page');

-- Step 9: Re-enable the triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Re-enable the trigger on all tables that have it (corrected query)
    FOR r IN 
        SELECT n.nspname as schema_name, c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE t.tgname = 'update_updated_at_trigger'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE TRIGGER update_updated_at_trigger', r.schema_name, r.table_name);
    END LOOP;
END $$;

-- Step 10: Verification query
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  COUNT(DISTINCT d.id) as database_count,
  COUNT(DISTINCT b.id) as page_count,
  COUNT(DISTINCT wm.id) as member_count
FROM public.workspaces w
LEFT JOIN public.databases d ON w.id = d.workspace_id
LEFT JOIN public.blocks b ON w.id = b.workspace_id AND b.type = 'page'
LEFT JOIN public.workspace_members wm ON w.id = wm.workspace_id
GROUP BY w.id, w.name
ORDER BY w.created_at;
