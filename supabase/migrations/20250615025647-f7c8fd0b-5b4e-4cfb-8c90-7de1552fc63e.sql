
-- Create an ENUM type for different permission levels on a block.
CREATE TYPE public.block_permission_level AS ENUM (
  'view',
  'comment',
  'edit',
  'full_access'
);

-- Create an ENUM type to distinguish between user and group permissions.
CREATE TYPE public.grantee_type AS ENUM (
  'user',
  'group'
);

-- Create the 'block_permissions' table to store permissions for individual blocks.
CREATE TABLE public.block_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  permission_level public.block_permission_level NOT NULL,
  grantee_type public.grantee_type NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- This constraint ensures that a permission is granted to either a user or a group, but not both.
  CONSTRAINT chk_grantee CHECK (
    (grantee_type = 'user' AND user_id IS NOT NULL AND group_id IS NULL) OR
    (grantee_type = 'group' AND group_id IS NOT NULL AND user_id IS NULL)
  ),

  -- Ensure that a permission for a block is unique per user or group.
  UNIQUE (block_id, user_id),
  UNIQUE (block_id, group_id)
);

-- Add comments for clarity
COMMENT ON TABLE public.block_permissions IS 'Stores permissions for individual blocks, granted to users or groups.';
COMMENT ON COLUMN public.block_permissions.permission_level IS 'Defines the level of access: view, comment, edit, or full_access.';
COMMENT ON COLUMN public.block_permissions.grantee_type IS 'Specifies whether the permission is for a ''user'' or a ''group''.';

-- Create indexes for better query performance.
CREATE INDEX idx_block_permissions_block_id ON public.block_permissions(block_id);
CREATE INDEX idx_block_permissions_user_id ON public.block_permissions(user_id);
CREATE INDEX idx_block_permissions_group_id ON public.block_permissions(group_id);

-- Enable Row Level Security (RLS) on the table.
ALTER TABLE public.block_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow workspace members to view permissions for blocks within their workspace.
CREATE POLICY "Workspace members can view block permissions" ON public.block_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.blocks b
    WHERE b.id = public.block_permissions.block_id
      AND public.user_has_workspace_access(b.workspace_id, auth.uid())
  )
);

-- RLS Policy: Allow block creators and workspace admins to manage permissions.
CREATE POLICY "Users with full access can manage block permissions" ON public.block_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.id = public.block_permissions.block_id AND (
      b.created_by = auth.uid() OR
      public.user_is_workspace_admin(b.workspace_id, auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.id = public.block_permissions.block_id AND (
      b.created_by = auth.uid() OR
      public.user_is_workspace_admin(b.workspace_id, auth.uid())
    )
  )
);

