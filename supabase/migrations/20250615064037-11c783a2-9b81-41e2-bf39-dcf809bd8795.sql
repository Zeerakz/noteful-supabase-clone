
-- Add 'none' to the permission level enum to fix the migration error.
-- This needs to be run in a separate transaction before the functions that use it are created.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.block_permission_level'::regtype AND enumlabel = 'none') THEN
        ALTER TYPE public.block_permission_level ADD VALUE 'none';
    END IF;
END$$;
