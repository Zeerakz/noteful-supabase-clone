
-- Fix for workspace creation RLS issue.
-- The previous policy for inserting into workspace_members didn't account for the initial owner creation via trigger.
-- This change adds a condition to the RLS policy to specifically allow the workspace owner to be added as a member during creation.

-- Drop the old, problematic policy
DROP POLICY IF EXISTS "Owners and admins can add new members" ON public.workspace_members;

-- Re-create the policy with an additional check for the workspace owner.
-- This allows the after-insert trigger on `workspaces` to successfully add the owner to `workspace_members`.
CREATE POLICY "Owners and admins can add new members" ON public.workspace_members
FOR INSERT TO authenticated
WITH CHECK (
    -- Condition for existing members to add others
    public.check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[])
    -- OR: Condition to allow the trigger to add the new workspace's owner
    OR public.is_workspace_owner(workspace_id, auth.uid())
);
