
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

-- Create roles table
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.roles (role_name, description) VALUES
  ('admin', 'Full access to workspace management and content'),
  ('editor', 'Can create and edit content but cannot manage workspace settings'),
  ('viewer', 'Read-only access to workspace content');

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspace_membership table
CREATE TABLE public.workspace_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  role_id INTEGER REFERENCES public.roles(id) NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  UNIQUE(user_id, workspace_id)
);

-- Create security definer function to get user role in workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace_role(workspace_uuid UUID, user_uuid UUID)
RETURNS TEXT AS $$
  SELECT r.role_name 
  FROM public.workspace_membership wm
  JOIN public.roles r ON wm.role_id = r.id
  WHERE wm.workspace_id = workspace_uuid 
    AND wm.user_id = user_uuid 
    AND wm.status = 'accepted';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check if user is workspace owner
CREATE OR REPLACE FUNCTION public.is_workspace_owner(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = workspace_uuid AND owner_user_id = user_uuid
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_membership ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table (read-only for authenticated users)
CREATE POLICY "Anyone can view roles" ON public.roles
  FOR SELECT TO authenticated
  USING (true);

-- RLS Policies for workspaces table
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
  FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM public.workspace_membership wm
      WHERE wm.workspace_id = id 
        AND wm.user_id = auth.uid() 
        AND wm.status = 'accepted'
    )
  );

CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Workspace owners and admins can update workspaces" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (
    owner_user_id = auth.uid() OR
    public.get_user_workspace_role(id, auth.uid()) = 'admin'
  );

CREATE POLICY "Workspace owners can delete workspaces" ON public.workspaces
  FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());

-- RLS Policies for workspace_membership table
CREATE POLICY "Users can view memberships for workspaces they belong to" ON public.workspace_membership
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.get_user_workspace_role(workspace_id, auth.uid()) = 'admin'
  );

CREATE POLICY "Workspace owners and admins can create memberships" ON public.workspace_membership
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.get_user_workspace_role(workspace_id, auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update their own membership status" ON public.workspace_membership
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Workspace owners and admins can update memberships" ON public.workspace_membership
  FOR UPDATE TO authenticated
  USING (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.get_user_workspace_role(workspace_id, auth.uid()) = 'admin'
  );

CREATE POLICY "Workspace owners and admins can delete memberships" ON public.workspace_membership
  FOR DELETE TO authenticated
  USING (
    public.is_workspace_owner(workspace_id, auth.uid()) OR
    public.get_user_workspace_role(workspace_id, auth.uid()) = 'admin'
  );

-- Create indexes for better performance
CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_user_id);
CREATE INDEX idx_workspace_membership_user ON public.workspace_membership(user_id);
CREATE INDEX idx_workspace_membership_workspace ON public.workspace_membership(workspace_id);
CREATE INDEX idx_workspace_membership_role ON public.workspace_membership(role_id);
CREATE INDEX idx_workspace_membership_status ON public.workspace_membership(status);
