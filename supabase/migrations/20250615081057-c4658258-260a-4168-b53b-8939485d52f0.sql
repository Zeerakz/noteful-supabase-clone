
-- Migration to fix infinite recursion in RLS policies for teamspace_members.
-- This script creates a new helper function and replaces the problematic policies
-- with non-recursive versions that use secure, non-recursive helper functions.

-- Step 1: Create a new helper function to check teamspace membership with a specific role.
-- This function is a SECURITY DEFINER to avoid recursion.
CREATE OR REPLACE FUNCTION public.check_teamspace_membership_with_role(p_teamspace_id UUID, p_user_id UUID, p_required_roles public.teamspace_member_role[] DEFAULT ARRAY['admin', 'member']::public.teamspace_member_role[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_role public.teamspace_member_role;
BEGIN
    SELECT role INTO v_user_role FROM public.teamspace_members
    WHERE teamspace_id = p_teamspace_id AND user_id = p_user_id;

    IF v_user_role IS NULL THEN
        RETURN false;
    END IF;

    RETURN v_user_role = ANY(p_required_roles);
END;
$$;
COMMENT ON FUNCTION public.check_teamspace_membership_with_role IS 'Checks if a user is a member of a teamspace with one of the required roles. SECURITY DEFINER to prevent RLS recursion.';

-- Step 2: Drop all old, recursive RLS policies on the teamspace_members table.
-- It's safer to drop all known variants to ensure a clean state.
DROP POLICY IF EXISTS "Teamspace members can view other members" ON public.teamspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage teamspace members" ON public.teamspace_members;
DROP POLICY IF EXISTS "Teamspace admins can manage teamspace members" ON public.teamspace_members;

-- Step 3: Recreate the policies using the correct helper functions to avoid recursion.

-- Policy for viewing members: Any member of a teamspace can see the other members.
CREATE POLICY "Teamspace members can view other members"
ON public.teamspace_members FOR SELECT
USING (
  public.is_teamspace_member(teamspace_id, auth.uid())
);
COMMENT ON POLICY "Teamspace members can view other members" ON public.teamspace_members IS 'Allows members of a teamspace to view the member list.';


-- Policy for managing members (INSERT, UPDATE, DELETE):
-- Allows workspace owners/admins OR teamspace admins to manage members.
CREATE POLICY "Admins can manage teamspace members"
ON public.teamspace_members FOR ALL
USING (
  -- Condition 1: User is a workspace owner or admin.
  check_workspace_membership(
    (SELECT workspace_id FROM public.teamspaces WHERE id = teamspace_id),
    auth.uid(),
    ARRAY['owner', 'admin']::public.workspace_role[]
  )
  OR
  -- Condition 2: User is a teamspace admin.
  check_teamspace_membership_with_role(teamspace_id, auth.uid(), ARRAY['admin']::public.teamspace_member_role[])
);
COMMENT ON POLICY "Admins can manage teamspace members" ON public.teamspace_members IS 'Allows workspace admins or teamspace admins to manage teamspace members.';
