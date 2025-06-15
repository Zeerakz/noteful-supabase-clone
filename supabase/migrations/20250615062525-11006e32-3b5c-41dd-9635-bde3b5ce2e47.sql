
-- Create teamspaces table
CREATE TABLE IF NOT EXISTS public.teamspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.teamspaces IS 'Team-specific areas within a workspace.';

-- Create teamspace_members table
CREATE TABLE IF NOT EXISTS public.teamspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teamspace_id UUID NOT NULL REFERENCES public.teamspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (teamspace_id, user_id)
);
COMMENT ON TABLE public.teamspace_members IS 'Manages user membership within teamspaces.';

-- RLS for teamspaces
ALTER TABLE public.teamspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can view teamspaces" ON public.teamspaces;
CREATE POLICY "Workspace members can view teamspaces"
ON public.teamspaces FOR SELECT
USING (check_workspace_membership(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Workspace admins can manage teamspaces" ON public.teamspaces;
CREATE POLICY "Workspace admins can manage teamspaces"
ON public.teamspaces FOR ALL
USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::workspace_role[]));

-- RLS for teamspace_members
ALTER TABLE public.teamspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teamspace members can view other members" ON public.teamspace_members;
CREATE POLICY "Teamspace members can view other members"
ON public.teamspace_members FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.teamspace_members tm
    WHERE tm.teamspace_id = public.teamspace_members.teamspace_id
    AND tm.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Workspace admins can manage teamspace members" ON public.teamspace_members;
CREATE POLICY "Workspace admins can manage teamspace members"
ON public.teamspace_members FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.teamspaces t
    JOIN public.workspace_members wm ON t.workspace_id = wm.workspace_id
    WHERE t.id = public.teamspace_members.teamspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
));

-- Now, the rest of the script from the failed migration.

-- Helper function to check if a user is a member of a teamspace.
CREATE OR REPLACE FUNCTION public.is_teamspace_member(p_teamspace_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teamspace_members
    WHERE teamspace_id = p_teamspace_id AND user_id = p_user_id
  );
$$;

-- Add the teamspace_id column to the blocks table.
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS teamspace_id UUID NULL;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_blocks_teamspace_id' AND conrelid = 'public.blocks'::regclass
  ) THEN
    ALTER TABLE public.blocks
    ADD CONSTRAINT fk_blocks_teamspace_id
      FOREIGN KEY (teamspace_id)
      REFERENCES public.teamspaces(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;


-- Helper function to find the ultimate permission-defining ancestor of a block.
CREATE OR REPLACE FUNCTION public.get_block_ancestor_permission_source(p_block_id uuid)
RETURNS TABLE (ancestor_id uuid, ancestor_parent_id uuid, ancestor_teamspace_id uuid, ancestor_created_by uuid)
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE block_ancestry AS (
      SELECT id, parent_id, teamspace_id, created_by, 0 as depth
      FROM public.blocks
      WHERE id = p_block_id

      UNION ALL

      SELECT b.id, b.parent_id, b.teamspace_id, b.created_by, ba.depth + 1
      FROM public.blocks b
      JOIN block_ancestry ba ON b.id = ba.parent_id
      WHERE ba.depth < 10 -- Safety break for recursion
  )
  SELECT id, parent_id, teamspace_id, created_by
  FROM block_ancestry
  WHERE parent_id IS NULL OR teamspace_id IS NOT NULL
  ORDER BY depth DESC
  LIMIT 1;
$$;


-- Security function to check if a user can access a block based on the new hierarchy.
CREATE OR REPLACE FUNCTION public.can_access_block(p_block_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  source_rec RECORD;
  is_workspace_member boolean;
BEGIN
  SELECT public.check_workspace_membership(b.workspace_id, p_user_id) INTO is_workspace_member
  FROM public.blocks b WHERE b.id = p_block_id;

  IF NOT COALESCE(is_workspace_member, false) THEN RETURN false; END IF;

  SELECT ancestor_teamspace_id, ancestor_parent_id, ancestor_created_by
  INTO source_rec
  FROM public.get_block_ancestor_permission_source(p_block_id);

  IF NOT FOUND THEN RETURN false; END IF;
  
  IF source_rec.ancestor_teamspace_id IS NOT NULL THEN
    RETURN public.is_teamspace_member(source_rec.ancestor_teamspace_id, p_user_id);
  END IF;
  
  IF source_rec.ancestor_parent_id IS NULL THEN -- Private root page
    RETURN source_rec.ancestor_created_by = p_user_id;
  END IF;

  RETURN false;
END;
$$;


-- Enable RLS on the blocks table
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Members can view blocks in their workspace" ON public.blocks;
DROP POLICY IF EXISTS "Editors can manage blocks in their workspace" ON public.blocks;
DROP POLICY IF EXISTS "Users can view accessible blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can create blocks in accessible locations" ON public.blocks;
DROP POLICY IF EXISTS "Users can update accessible blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete accessible blocks" ON public.blocks;

-- RLS Policies for blocks table
CREATE POLICY "Users can view accessible blocks"
ON public.blocks FOR SELECT
USING (public.can_access_block(id, auth.uid()));

CREATE POLICY "Users can create blocks in accessible locations"
ON public.blocks FOR INSERT
WITH CHECK (
  check_workspace_membership(workspace_id, auth.uid()) AND (
    (parent_id IS NOT NULL AND public.can_access_block(parent_id, auth.uid()))
    OR
    (parent_id IS NULL AND teamspace_id IS NOT NULL AND public.is_teamspace_member(teamspace_id, auth.uid()))
    OR
    (parent_id IS NULL AND teamspace_id IS NULL AND created_by = auth.uid())
  )
);

CREATE POLICY "Users can update accessible blocks"
ON public.blocks FOR UPDATE
USING (public.can_access_block(id, auth.uid()));

CREATE POLICY "Users can delete accessible blocks"
ON public.blocks FOR DELETE
USING (public.can_access_block(id, auth.uid()));


-- Update the global_search function to respect new permissions
CREATE OR REPLACE FUNCTION public.global_search(search_query text, user_workspace_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(type text, id uuid, title text, workspace_id uuid, created_by uuid, created_at timestamp with time zone, display_title text, display_content text, rank real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH page_content AS (
    SELECT
      p.id,
      p.properties->>'title' as title,
      p.workspace_id,
      p.created_by,
      p.created_time as created_at,
      COALESCE(string_agg(b.content->>'text', ' '), '') as content_text
    FROM public.blocks p
    LEFT JOIN public.blocks b ON b.parent_id = p.id
    WHERE p.type = 'page'
    AND (user_workspace_id IS NULL OR p.workspace_id = user_workspace_id)
    AND public.can_access_block(p.id, auth.uid())
    GROUP BY p.id
  ),
  page_results AS (
    SELECT
      'page'::text as type,
      pc.id,
      pc.title,
      pc.workspace_id,
      pc.created_by,
      pc.created_at,
      pc.title as display_title,
      pc.content_text as display_content,
      ts_rank(
        to_tsvector('english', COALESCE(pc.title, '') || ' ' || COALESCE(pc.content_text, '')),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM page_content pc
    WHERE to_tsvector('english', COALESCE(pc.title, '') || ' ' || COALESCE(pc.content_text, ''))
          @@ plainto_tsquery('english', search_query)
  ),
  block_results AS (
    SELECT
      'block'::text as type,
      b.id,
      p.properties->>'title' as title,
      p.workspace_id,
      b.created_by,
      b.created_time as created_at,
      p.properties->>'title' as display_title,
      COALESCE(b.content->>'text', '') as display_content,
      ts_rank(
        to_tsvector('english',
          COALESCE(p.properties->>'title', '') || ' ' ||
          COALESCE(b.content->>'text', '')
        ),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM public.blocks b
    JOIN public.blocks p ON b.parent_id = p.id
    WHERE p.type = 'page'
    AND (user_workspace_id IS NULL OR b.workspace_id = user_workspace_id)
    AND public.can_access_block(b.id, auth.uid())
    AND b.content->>'text' IS NOT NULL
    AND b.content->>'text' != ''
    AND to_tsvector('english',
          COALESCE(p.properties->>'title', '') || ' ' ||
          COALESCE(b.content->>'text', '')
        ) @@ plainto_tsquery('english', search_query)
  )
  SELECT * FROM page_results
  UNION ALL
  SELECT * FROM block_results
  ORDER BY rank DESC, created_at DESC
  LIMIT 50;
$function$;
