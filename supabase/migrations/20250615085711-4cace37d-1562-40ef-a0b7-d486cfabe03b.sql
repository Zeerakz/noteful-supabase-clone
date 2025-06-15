
-- This migration enables Row-Level Security (RLS) for workspace members and profiles,
-- ensuring that users can only view information within the workspaces they belong to.
-- This script is idempotent and can be run safely even if policies already exist.

-- Step 1: Enable RLS on the workspace_members table (if not already enabled)
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop and recreate policy to allow users to view members of their workspaces.
DROP POLICY IF EXISTS "Users can view members of their own workspaces" ON public.workspace_members;
CREATE POLICY "Users can view members of their own workspaces"
ON public.workspace_members FOR SELECT
USING (
  check_workspace_membership(workspace_id, auth.uid())
);

-- Step 3: Enable RLS on the profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop and recreate policy to allow users to view profiles of members in shared workspaces.
DROP POLICY IF EXISTS "Users can view profiles of members in shared workspaces" ON public.profiles;
CREATE POLICY "Users can view profiles of members in shared workspaces"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm1
    JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
  )
  OR profiles.id = auth.uid()
);

-- Step 5: Drop and recreate policy to allow users to update their own profile.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
