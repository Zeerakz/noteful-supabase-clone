
-- This migration fixes a row-level security (RLS) issue that prevents users from creating new workspaces.
-- The problem occurs because the SELECT policy on the `workspaces` table is too strict.
-- When a new workspace is created with `.insert().select()`, the SELECT part of the query
-- runs before the AFTER INSERT trigger can add the owner to the `workspace_members` table.
-- This causes the SELECT to fail its permission check, which in turn rolls back the entire INSERT operation.

-- To fix this, we'll update the SELECT policy to also allow the workspace owner to view the workspace,
-- which is necessary for the `.select()` part of the insert query to succeed.

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;

-- Re-create the policy with an additional check for the workspace owner
CREATE POLICY "Users can view workspaces they are members of" ON public.workspaces
FOR SELECT TO authenticated
USING (
  -- Allow members to view the workspace
  public.check_workspace_membership(id, auth.uid())
  -- OR: Also allow the owner to view the workspace, which is crucial during creation
  OR public.is_workspace_owner(id, auth.uid())
);
