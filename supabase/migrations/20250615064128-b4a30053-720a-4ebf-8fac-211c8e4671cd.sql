
-- Step 1: Drop existing RLS policies on the blocks table that may depend on old functions.
DROP POLICY IF EXISTS "Users can view accessible blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can create blocks in accessible locations" ON public.blocks;
DROP POLICY IF EXISTS "Users can update accessible blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete accessible blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can view blocks they have access to" ON public.blocks;
DROP POLICY IF EXISTS "Users can create blocks if they can edit parent" ON public.blocks;
DROP POLICY IF EXISTS "Users can update blocks they can edit" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete blocks they can edit" ON public.blocks;


-- Step 2: Drop the old permission functions now that dependent policies are removed.
DROP FUNCTION IF EXISTS public.can_access_block(uuid, uuid);
-- get_block_ancestor_permission_source is still used by another function, so we keep it.
DROP FUNCTION IF EXISTS public.get_user_final_block_permission(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_user_access_block(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_workspace_permission_level(uuid, uuid);


-- Step 3: Create new helper functions for the new permission model.

-- Function to get a user's permission level within a workspace based on their role.
CREATE OR REPLACE FUNCTION public.get_user_workspace_permission_level(p_workspace_id uuid, p_user_id uuid)
RETURNS public.block_permission_level
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_role public.workspace_role;
BEGIN
  SELECT role INTO member_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'none';
  END IF;

  IF member_role IN ('owner', 'admin') THEN
    RETURN 'full_access';
  ELSIF member_role = 'member' THEN
    RETURN 'edit';
  ELSIF member_role = 'guest' THEN
    RETURN 'view';
  END IF;

  RETURN 'none';
END;
$$;

-- Function to determine the final, highest permission level for a user on a block
-- by combining inherited block permissions and workspace-level permissions.
CREATE OR REPLACE FUNCTION public.get_user_final_block_permission(p_block_id uuid, p_user_id uuid)
RETURNS public.block_permission_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH permissions AS (
  SELECT 
    public.get_inherited_block_permission(p_block_id, p_user_id) as inherited_level,
    public.get_user_workspace_permission_level(b.workspace_id, p_user_id) as workspace_level
  FROM public.blocks b
  WHERE b.id = p_block_id
),
permission_values AS (
  SELECT
    p.inherited_level,
    p.workspace_level,
    CASE COALESCE(p.inherited_level, 'none')
      WHEN 'full_access' THEN 4
      WHEN 'edit' THEN 3
      WHEN 'comment' THEN 2
      WHEN 'view' THEN 1
      ELSE 0
    END AS inherited_val,
    CASE COALESCE(p.workspace_level, 'none')
      WHEN 'full_access' THEN 4
      WHEN 'edit' THEN 3
      WHEN 'comment' THEN 2
      WHEN 'view' THEN 1
      ELSE 0
    END AS workspace_val
  FROM permissions p
)
SELECT 
  CASE
    WHEN inherited_val >= workspace_val THEN inherited_level
    ELSE workspace_level
  END
FROM permission_values;
$$;

-- Function to check if a user has at least 'view' access to a block.
CREATE OR REPLACE FUNCTION public.can_user_access_block(p_block_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_user_final_block_permission(p_block_id, p_user_id)) <> 'none';
$$;


-- Step 4: Update the global_search function to use the new permission model.
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
    AND public.can_user_access_block(p.id, auth.uid())
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
    AND public.can_user_access_block(b.id, auth.uid())
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

-- Step 5: Enable RLS on blocks table and apply new policies.
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Users can SELECT blocks if they have any level of access.
CREATE POLICY "Users can view blocks they have access to"
ON public.blocks FOR SELECT
USING (
  public.can_user_access_block(id, auth.uid())
);

-- Users can INSERT blocks if they have 'edit' or 'full_access' on the parent.
CREATE POLICY "Users can create blocks if they can edit parent"
ON public.blocks FOR INSERT
WITH CHECK (
  (
    CASE
      WHEN parent_id IS NOT NULL THEN (public.get_user_final_block_permission(parent_id, auth.uid()))
      ELSE (public.get_user_workspace_permission_level(workspace_id, auth.uid()))
    END
  ) IN ('edit', 'full_access')
);

-- Users can UPDATE blocks if they have 'edit' or 'full_access' permission.
CREATE POLICY "Users can update blocks they can edit"
ON public.blocks FOR UPDATE
USING (
  (public.get_user_final_block_permission(id, auth.uid())) IN ('edit', 'full_access')
)
WITH CHECK (
  (public.get_user_final_block_permission(id, auth.uid())) IN ('edit', 'full_access')
);

-- Users can DELETE blocks if they have 'edit' or 'full_access' permission.
CREATE POLICY "Users can delete blocks they can edit"
ON public.blocks FOR DELETE
USING (
  (public.get_user_final_block_permission(id, auth.uid())) IN ('edit', 'full_access')
);
