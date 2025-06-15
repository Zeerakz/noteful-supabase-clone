
-- This migration script re-applies Row-Level Security (RLS) policies for invitations
-- and workspace members, with a fix for the failing UPDATE policy.

-- Step 1: Ensure RLS is enabled on the invitations table and apply granular policies.
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop the old generic policy if it exists for a clean slate.
DROP POLICY IF EXISTS "Allow admins and owners to manage invitations" ON public.invitations;

-- Policy for viewing invitations.
DROP POLICY IF EXISTS "Allow admins/owners to view invitations" ON public.invitations;
CREATE POLICY "Allow admins/owners to view invitations"
ON public.invitations FOR SELECT
USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));

-- Policy for creating invitations.
DROP POLICY IF EXISTS "Allow admins/owners to create invitations" ON public.invitations;
CREATE POLICY "Allow admins/owners to create invitations"
ON public.invitations FOR INSERT
WITH CHECK (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));

-- Policy for deleting (canceling) invitations.
DROP POLICY IF EXISTS "Allow admins/owners to cancel invitations" ON public.invitations;
CREATE POLICY "Allow admins/owners to cancel invitations"
ON public.invitations FOR DELETE
USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));


-- Step 2: Ensure RLS is enabled on workspace_members and apply granular policies.
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Policy for viewing workspace members.
DROP POLICY IF EXISTS "Members can view other members in the same workspace" ON public.workspace_members;
CREATE POLICY "Members can view other members in the same workspace"
ON public.workspace_members FOR SELECT
USING (check_workspace_membership(workspace_id, auth.uid()));

-- Policy for updating member roles.
-- This version uses implicit references to the new row's columns in the
-- WITH CHECK clause to avoid the "missing FROM-clause" parsing error.
DROP POLICY IF EXISTS "Allow admins and owners to update member roles" ON public.workspace_members;
CREATE POLICY "Allow admins and owners to update member roles"
ON public.workspace_members FOR UPDATE
USING (
  -- The user must be an owner/admin in the *current* workspace to initiate an update.
  check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[])
  -- And they cannot update the 'owner' role.
  AND role <> 'owner'::public.workspace_role
)
WITH CHECK (
  -- The user must also be an owner/admin of the *target* workspace (in case workspace_id is changed).
  -- In a WITH CHECK clause, unqualified columns refer to the NEW row.
  check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[])
  -- And the role cannot be updated TO 'owner'.
  AND role <> 'owner'::public.workspace_role
);

-- Policy for deleting (removing) members.
DROP POLICY IF EXISTS "Allow admins and owners to remove members" ON public.workspace_members;
CREATE POLICY "Allow admins and owners to remove members"
ON public.workspace_members FOR DELETE
USING (
  check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[])
  AND role <> 'owner'::public.workspace_role
);
