
-- Drop old policies that might exist to ensure a clean slate
DROP POLICY IF EXISTS "Allow members to view workspace databases" ON public.databases;
DROP POLICY IF EXISTS "Allow admins to create, update, and delete databases" ON public.databases;
DROP POLICY IF EXISTS "Users can view databases in accessible workspaces" ON public.databases;
DROP POLICY IF EXISTS "Users can create databases in accessible workspaces" ON public.databases;
DROP POLICY IF EXISTS "Users can update databases in accessible workspaces" ON public.databases;
DROP POLICY IF EXISTS "Users can delete databases in accessible workspaces" ON public.databases;

-- Enable Row Level Security on the 'databases' table
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;

-- Policy to allow workspace members to view databases
CREATE POLICY "Allow members to view workspace databases"
ON public.databases FOR SELECT
USING (
  public.check_workspace_membership(workspace_id, auth.uid())
);

-- Policy to allow workspace admins and owners to manage databases
CREATE POLICY "Allow admins to create, update, and delete databases"
ON public.databases FOR ALL
USING (
  public.check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[])
);
