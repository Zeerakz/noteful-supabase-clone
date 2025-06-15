
-- Step 1: Create the new enum type for workspace roles.
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member', 'guest');

-- Step 2: Drop old tables and dependent functions.
-- This is a destructive action and will remove existing membership and role data.
-- Using CASCADE to automatically drop dependent policies and other objects.
DROP FUNCTION IF EXISTS public.user_has_workspace_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_workspace_access_with_role(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_edit_workspace(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_is_workspace_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_workspace_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.global_search(text, uuid) CASCADE;

-- Drop old tables using CASCADE to handle dependencies.
DROP TABLE IF EXISTS public.workspace_membership CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Step 3: Create the new 'workspace_members' table.
CREATE TABLE public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.workspace_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id)
);
COMMENT ON TABLE public.workspace_members IS 'Manages user roles within workspaces.';

-- Step 4: Create the 'invitations' table for pending invites.
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.workspace_role NOT NULL,
    token TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.invitations IS 'Stores pending invitations for users to join workspaces.';
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Step 5: Create a function to add the workspace owner to the members table upon workspace creation.
CREATE OR REPLACE FUNCTION public.add_owner_to_workspace_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.owner_user_id, 'owner');
    RETURN NEW;
END;
$$;

-- Step 6: Create a trigger to call the function when a new workspace is created.
CREATE TRIGGER on_workspace_created
AFTER INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.add_owner_to_workspace_members();

-- Step 7: Create a new helper function for checking roles.
CREATE OR REPLACE FUNCTION public.check_workspace_membership(p_workspace_id UUID, p_user_id UUID, p_required_roles workspace_role[] DEFAULT ARRAY['owner', 'admin', 'member', 'guest']::workspace_role[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role public.workspace_role;
BEGIN
    SELECT role INTO user_role FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id;

    IF user_role IS NULL THEN
        RETURN false;
    END IF;

    RETURN user_role = ANY(p_required_roles);
END;
$$;

-- Step 8: Recreate the global_search function to use the new membership table.
CREATE OR REPLACE FUNCTION public.global_search(search_query text, user_workspace_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(type text, id uuid, title text, workspace_id uuid, created_by uuid, created_at timestamp with time zone, display_title text, display_content text, rank real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH accessible_workspaces AS (
    SELECT wm.workspace_id
    FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND (user_workspace_id IS NULL OR wm.workspace_id = user_workspace_id)
  ),
  page_content AS (
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
    AND p.workspace_id IN (SELECT workspace_id FROM accessible_workspaces)
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
    AND p.workspace_id IN (SELECT workspace_id FROM accessible_workspaces)
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

-- Step 9: Re-apply Row Level Security policies to core tables.
-- The old policies were dropped by CASCADE, so we recreate them here.

-- Policies for `blocks` table
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view blocks in their workspace" ON public.blocks FOR SELECT TO authenticated
  USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin', 'member', 'guest']::workspace_role[]));
CREATE POLICY "Editors can manage blocks in their workspace" ON public.blocks FOR ALL TO authenticated
  USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin', 'member']::workspace_role[]))
  WITH CHECK (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin', 'member']::workspace_role[]));

-- Policies for `databases` table
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view databases in their workspace" ON public.databases FOR SELECT TO authenticated
  USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin', 'member', 'guest']::workspace_role[]));
CREATE POLICY "Admins can manage databases in their workspace" ON public.databases FOR ALL TO authenticated
  USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::workspace_role[]))
  WITH CHECK (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::workspace_role[]));

-- Policies for `comments` table
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage comments in their workspace" ON public.comments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.id = public.comments.block_id AND check_workspace_membership(b.workspace_id, auth.uid(), ARRAY['owner', 'admin', 'member']::workspace_role[])
  ));

-- Policies for `block_permissions` table
ALTER TABLE public.block_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view block permissions" ON public.block_permissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.id = public.block_permissions.block_id AND check_workspace_membership(b.workspace_id, auth.uid())
  ));
CREATE POLICY "Full access members can manage block permissions" ON public.block_permissions FOR ALL TO authenticated
  USING (public.get_inherited_block_permission(block_id, auth.uid()) = 'full_access');

