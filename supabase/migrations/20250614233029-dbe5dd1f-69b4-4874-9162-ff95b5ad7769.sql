
-- Step 1: Safely rename existing tables to preserve data.
DO $$
BEGIN
   -- Check for the old 'blocks' table structure before renaming.
   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocks') AND
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blocks' AND column_name = 'page_id') AND
      NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blocks' AND column_name = 'properties')
   THEN
      ALTER TABLE public.blocks RENAME TO legacy_blocks;
   END IF;
END $$;

DO $$
BEGIN
   -- Rename 'pages' table if it exists.
   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pages') THEN
      ALTER TABLE public.pages RENAME TO legacy_pages;
   END IF;
END $$;

-- Step 2: Create the new universal block type enum if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'block_type_enum') THEN
        CREATE TYPE public.block_type_enum AS ENUM (
            'page', 'database', 'text', 'image', 'heading_1', 'heading_2', 'heading_3',
            'todo_item', 'bulleted_list_item', 'numbered_list_item', 'toggle_list',
            'code', 'quote', 'divider', 'callout'
        );
    END IF;
END$$;

-- Step 3: Create the new universal blocks table if it doesn't exist.
CREATE TABLE IF NOT EXISTS public.blocks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid NOT NULL,
    type public.block_type_enum NOT NULL,
    parent_id uuid,
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    content jsonb,
    created_time timestamp with time zone NOT NULL DEFAULT now(),
    last_edited_time timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    last_edited_by uuid,
    archived boolean NOT NULL DEFAULT false,
    in_trash boolean NOT NULL DEFAULT false
);

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocks_workspace_id_fkey' AND conrelid = 'public.blocks'::regclass) THEN
        ALTER TABLE public.blocks ADD CONSTRAINT blocks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocks_parent_id_fkey' AND conrelid = 'public.blocks'::regclass) THEN
        ALTER TABLE public.blocks ADD CONSTRAINT blocks_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blocks(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocks_created_by_fkey' AND conrelid = 'public.blocks'::regclass) THEN
        ALTER TABLE public.blocks ADD CONSTRAINT blocks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocks_last_edited_by_fkey' AND conrelid = 'public.blocks'::regclass) THEN
        ALTER TABLE public.blocks ADD CONSTRAINT blocks_last_edited_by_fkey FOREIGN KEY (last_edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 4: Add indexes for performance if they don't exist.
CREATE INDEX IF NOT EXISTS idx_blocks_parent_id ON public.blocks(parent_id);
CREATE INDEX IF NOT EXISTS idx_blocks_workspace_id ON public.blocks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON public.blocks(type);
CREATE INDEX IF NOT EXISTS idx_blocks_created_by ON public.blocks(created_by);

-- Step 5: Enable Row Level Security.
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for the new blocks table idempotently.
DROP POLICY IF EXISTS "Users can access blocks in their workspace" ON public.blocks;
CREATE POLICY "Users can access blocks in their workspace"
ON public.blocks FOR SELECT
USING ( user_has_workspace_access(workspace_id, auth.uid()) );

DROP POLICY IF EXISTS "Users can insert blocks in workspaces they can edit" ON public.blocks;
CREATE POLICY "Users can insert blocks in workspaces they can edit"
ON public.blocks FOR INSERT
WITH CHECK ( user_can_edit_workspace(workspace_id, auth.uid()) AND created_by = auth.uid() );

DROP POLICY IF EXISTS "Users can update blocks they created or in workspaces they can edit" ON public.blocks;
CREATE POLICY "Users can update blocks they created or in workspaces they can edit"
ON public.blocks FOR UPDATE
USING ( (created_by = auth.uid()) OR (user_can_edit_workspace(workspace_id, auth.uid())) )
WITH CHECK ( last_edited_by = auth.uid() );

DROP POLICY IF EXISTS "Users can delete blocks they created or in workspaces they can edit" ON public.blocks;
CREATE POLICY "Users can delete blocks they created or in workspaces they can edit"
ON public.blocks FOR DELETE
USING ( (created_by = auth.uid()) OR (user_can_edit_workspace(workspace_id, auth.uid())) );

-- Step 7: Add a trigger to update last_edited_time.
CREATE OR REPLACE FUNCTION public.update_block_last_edited_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited_time = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_block_update ON public.blocks;
CREATE TRIGGER on_block_update
BEFORE UPDATE ON public.blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_block_last_edited_time();
