
-- Comprehensive RLS fix for workspace creation and function dependencies.
-- This migration uses CASCADE to resolve function dependencies and recreates all affected policies.
-- It explicitly drops all policies before recreating them to ensure idempotency.

-- Step 1: Drop core helper functions and all dependent objects (policies) using CASCADE.
DROP FUNCTION IF EXISTS public.check_workspace_membership(uuid, uuid, public.workspace_role[]) CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_owner(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_workspace_role(uuid, uuid) CASCADE;

-- Step 2: Re-create the helper functions with SECURITY DEFINER to avoid RLS recursion.
-- These functions are the foundation for the new RLS policies.

CREATE OR REPLACE FUNCTION public.is_workspace_owner(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = p_workspace_id AND owner_user_id = p_user_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_workspace_role(p_workspace_id UUID, p_user_id UUID)
RETURNS public.workspace_role AS $$
  SELECT role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.check_workspace_membership(p_workspace_id UUID, p_user_id UUID, p_required_roles public.workspace_role[] DEFAULT ARRAY['owner', 'admin', 'member', 'guest']::public.workspace_role[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_role public.workspace_role;
BEGIN
    SELECT role INTO v_user_role FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id;

    IF v_user_role IS NULL THEN
        RETURN false;
    END IF;

    RETURN v_user_role = ANY(p_required_roles);
END;
$$;

-- Step 3: Explicitly drop and re-create RLS policies for `workspaces` and `workspace_members`.
-- This section directly addresses the "Failed to create workspace" error.

-- Policies for `workspaces`
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Owners and admins can update their workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspace" ON public.workspaces;

CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Users can view workspaces they are members of" ON public.workspaces FOR SELECT TO authenticated USING (public.check_workspace_membership(id, auth.uid()));
CREATE POLICY "Owners and admins can update their workspace" ON public.workspaces FOR UPDATE TO authenticated USING (public.get_user_workspace_role(id, auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "Owners can delete their workspace" ON public.workspaces FOR DELETE TO authenticated USING (public.is_workspace_owner(id, auth.uid()));

-- Policies for `workspace_members`
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners and admins can add new members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view memberships for workspaces they are in" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can update member roles" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON public.workspace_members;

CREATE POLICY "Owners and admins can add new members" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (public.check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));
CREATE POLICY "Users can view memberships for workspaces they are in" ON public.workspace_members FOR SELECT TO authenticated USING (public.check_workspace_membership(workspace_id, auth.uid()));
CREATE POLICY "Owners and admins can update member roles" ON public.workspace_members FOR UPDATE TO authenticated USING (public.check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));
CREATE POLICY "Owners and admins can remove members" ON public.workspace_members FOR DELETE TO authenticated USING (public.check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]) AND role <> 'owner');


-- Step 4: Explicitly drop and re-create all policies that may have been affected.
-- This ensures that the security model for other tables remains intact and consistent.

-- Policies for `blocks` (using the latest permission model)
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view blocks they have access to" ON public.blocks;
DROP POLICY IF EXISTS "Users can create blocks if they can edit parent" ON public.blocks;
DROP POLICY IF EXISTS "Users can update blocks they can edit" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete blocks they can edit" ON public.blocks;

CREATE POLICY "Users can view blocks they have access to" ON public.blocks FOR SELECT USING (public.can_user_access_block(id, auth.uid()));
CREATE POLICY "Users can create blocks if they can edit parent" ON public.blocks FOR INSERT WITH CHECK ( (CASE WHEN parent_id IS NOT NULL THEN (public.get_user_final_block_permission(parent_id, auth.uid())) ELSE (public.get_user_workspace_permission_level(workspace_id, auth.uid())) END) IN ('edit', 'full_access') );
CREATE POLICY "Users can update blocks they can edit" ON public.blocks FOR UPDATE USING ( (public.get_user_final_block_permission(id, auth.uid())) IN ('edit', 'full_access') ) WITH CHECK ( (public.get_user_final_block_permission(id, auth.uid())) IN ('edit', 'full_access') );
CREATE POLICY "Users can delete blocks they can edit" ON public.blocks FOR DELETE USING ( (public.get_user_final_block_permission(id, auth.uid())) IN ('edit', 'full_access') );

-- Policies for `databases`
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view databases in their workspace" ON public.databases;
DROP POLICY IF EXISTS "Admins can manage databases in their workspace" ON public.databases;

CREATE POLICY "Members can view databases in their workspace" ON public.databases FOR SELECT TO authenticated USING (check_workspace_membership(workspace_id, auth.uid()));
CREATE POLICY "Admins can manage databases in their workspace" ON public.databases FOR ALL TO authenticated USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));

-- Policies for `teamspaces`
ALTER TABLE public.teamspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace members can view teamspaces" ON public.teamspaces;
DROP POLICY IF EXISTS "Workspace admins can manage teamspaces" ON public.teamspaces;

CREATE POLICY "Workspace members can view teamspaces" ON public.teamspaces FOR SELECT USING (check_workspace_membership(workspace_id, auth.uid()));
CREATE POLICY "Workspace admins can manage teamspaces" ON public.teamspaces FOR ALL USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));

-- Policies for `teamspace_members`
ALTER TABLE public.teamspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teamspace members can view other members" ON public.teamspace_members;
DROP POLICY IF EXISTS "Teamspace admins can manage teamspace members" ON public.teamspace_members;

CREATE POLICY "Teamspace members can view other members" ON public.teamspace_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.teamspace_members tm WHERE tm.teamspace_id = public.teamspace_members.teamspace_id AND tm.user_id = auth.uid()));
CREATE POLICY "Teamspace admins can manage teamspace members" ON public.teamspace_members FOR ALL USING ( (EXISTS (SELECT 1 FROM public.workspace_members wm JOIN public.teamspaces t ON t.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid() AND t.id = public.teamspace_members.teamspace_id AND wm.role IN ('owner', 'admin'))) OR (EXISTS (SELECT 1 FROM public.teamspace_members tm WHERE tm.teamspace_id = public.teamspace_members.teamspace_id AND tm.user_id = auth.uid() AND tm.role = 'admin')) );

-- Policies for `comments`
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can manage comments in their workspace" ON public.comments;
CREATE POLICY "Members can manage comments in their workspace" ON public.comments FOR ALL TO authenticated USING (EXISTS ( SELECT 1 FROM public.blocks b WHERE b.id = public.comments.block_id AND check_workspace_membership(b.workspace_id, auth.uid(), ARRAY['owner', 'admin', 'member']::workspace_role[])));

-- Policies for `block_permissions`
ALTER TABLE public.block_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view block permissions" ON public.block_permissions;
DROP POLICY IF EXISTS "Full access members can manage block permissions" ON public.block_permissions;

CREATE POLICY "Members can view block permissions" ON public.block_permissions FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM public.blocks b WHERE b.id = public.block_permissions.block_id AND check_workspace_membership(b.workspace_id, auth.uid()) ));
CREATE POLICY "Full access members can manage block permissions" ON public.block_permissions FOR ALL TO authenticated USING (public.get_inherited_block_permission(block_id, auth.uid()) = 'full_access');

-- Policies for `database_properties`
ALTER TABLE public.database_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to view database properties" ON public.database_properties;
DROP POLICY IF EXISTS "Allow admins to manage database properties" ON public.database_properties;

CREATE POLICY "Allow members to view database properties" ON public.database_properties FOR SELECT TO authenticated USING (check_workspace_membership((SELECT d.workspace_id FROM public.databases d WHERE d.id = database_properties.database_id), auth.uid()));
CREATE POLICY "Allow admins to manage database properties" ON public.database_properties FOR ALL TO authenticated USING (check_workspace_membership((SELECT d.workspace_id FROM public.databases d WHERE d.id = database_properties.database_id), auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));

-- Policies for `property_values`
ALTER TABLE public.property_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to view property values" ON public.property_values;
DROP POLICY IF EXISTS "Allow editors to manage property values" ON public.property_values;

CREATE POLICY "Allow members to view property values" ON public.property_values FOR SELECT TO authenticated USING (check_workspace_membership((SELECT b.workspace_id FROM public.blocks b WHERE b.id = property_values.page_id), auth.uid()));
CREATE POLICY "Allow editors to manage property values" ON public.property_values FOR ALL TO authenticated USING (check_workspace_membership((SELECT b.workspace_id FROM public.blocks b WHERE b.id = property_values.page_id), auth.uid(), ARRAY['owner', 'admin', 'member']::workspace_role[]));
