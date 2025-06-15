
-- Create the 'groups' table to store user groups within a workspace
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_workspace_group_name UNIQUE (workspace_id, name)
);

-- Add comments for clarity
COMMENT ON TABLE public.groups IS 'Stores user groups for permission management within a workspace.';
COMMENT ON COLUMN public.groups.name IS 'The name of the user group, unique within a workspace.';

-- Create the 'group_memberships' join table
CREATE TABLE public.group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Add comments for clarity
COMMENT ON TABLE public.group_memberships IS 'Links users to groups within a workspace.';

-- Create indexes for performance
CREATE INDEX idx_groups_workspace_id ON public.groups(workspace_id);
CREATE INDEX idx_group_memberships_group_id ON public.group_memberships(group_id);
CREATE INDEX idx_group_memberships_user_id ON public.group_memberships(user_id);

-- Enable Row Level Security (RLS) on the new tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'groups' table
CREATE POLICY "Workspace members can view groups" ON public.groups
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_membership wm
      WHERE wm.workspace_id = public.groups.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'accepted'
    ) OR
    public.is_workspace_owner(public.groups.workspace_id, auth.uid())
  );

CREATE POLICY "Workspace admins can create groups" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.get_user_workspace_role(workspace_id, auth.uid()) = 'admin'
  );

CREATE POLICY "Workspace admins can update groups" ON public.groups
  FOR UPDATE TO authenticated
  USING (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.get_user_workspace_role(workspace_id, auth.uid()) = 'admin'
  );

CREATE POLICY "Workspace admins can delete groups" ON public.groups
  FOR DELETE TO authenticated
  USING (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.get_user_workspace_role(workspace_id, auth.uid()) = 'admin'
  );

-- RLS Policies for 'group_memberships' table
CREATE POLICY "Workspace members can view memberships of groups in their workspace" ON public.group_memberships
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      JOIN public.workspace_membership wm ON g.workspace_id = wm.workspace_id
      WHERE g.id = public.group_memberships.group_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'accepted'
    )
  );

CREATE POLICY "Workspace admins can manage group memberships" ON public.group_memberships
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = public.group_memberships.group_id
      AND (
        public.is_workspace_owner(g.workspace_id, auth.uid()) OR
        public.get_user_workspace_role(g.workspace_id, auth.uid()) = 'admin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = public.group_memberships.group_id
      AND (
        public.is_workspace_owner(g.workspace_id, auth.uid()) OR
        public.get_user_workspace_role(g.workspace_id, auth.uid()) = 'admin'
      )
    )
  );

-- Create a trigger to automatically update the 'updated_at' timestamp on the 'groups' table
CREATE TRIGGER handle_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();

