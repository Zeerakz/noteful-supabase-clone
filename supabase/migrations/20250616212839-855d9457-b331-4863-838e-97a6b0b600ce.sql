
-- First, let's check what values are available in the workspace_role enum
-- and create the correct RLS policies for the 'blocks' table.

-- Policy to allow users to view blocks in workspaces they have access to.
CREATE POLICY "Users can view blocks in accessible workspaces"
ON public.blocks
FOR SELECT USING (
  public.get_user_workspace_role(workspace_id, auth.uid()) IS NOT NULL
);

-- Policy to allow users with 'member', 'admin', or 'owner' roles to create blocks.
-- It also ensures the creator is the authenticated user.
CREATE POLICY "Members and above can create blocks"
ON public.blocks
FOR INSERT WITH CHECK (
  public.get_user_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin', 'member')
  AND created_by = auth.uid()
);

-- Policy to allow users with 'member', 'admin', or 'owner' roles to update blocks.
CREATE POLICY "Members and above can update blocks"
ON public.blocks
FOR UPDATE USING (
  public.get_user_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin', 'member')
) WITH CHECK (
  last_edited_by = auth.uid()
);

-- Policy to allow users with 'admin' or 'owner' role to delete blocks.
CREATE POLICY "Admins and owners can delete blocks"
ON public.blocks
FOR DELETE USING (
  public.get_user_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
);
