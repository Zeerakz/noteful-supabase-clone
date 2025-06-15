
-- This migration enables Row-Level Security (RLS) for the invitations table
-- and adds a policy to ensure that users can only view invitations
-- for workspaces they are a member of. This is crucial for the pending
-- invitations list to function correctly.

-- Step 1: Enable RLS on the invitations table if not already enabled.
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policy to ensure a clean state.
DROP POLICY IF EXISTS "Users can view invitations for their workspaces" ON public.invitations;

-- Step 3: Create a policy to allow workspace members to view invitations.
CREATE POLICY "Users can view invitations for their workspaces"
ON public.invitations FOR SELECT
USING (
  -- The check_workspace_membership function already exists and securely
  -- verifies if the currently authenticated user is part of the specified workspace.
  check_workspace_membership(workspace_id, auth.uid())
);

