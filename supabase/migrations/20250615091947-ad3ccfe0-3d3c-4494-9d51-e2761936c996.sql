
-- This migration fixes a potential recursive RLS issue on the profiles table
-- by introducing a SECURITY DEFINER function to check for shared workspace membership.

-- Step 1: Create a function to check if the current user shares a workspace with another user.
-- Using SECURITY DEFINER allows this function to bypass the RLS policies on the queried tables,
-- preventing recursion when this function is used within another RLS policy.
CREATE OR REPLACE FUNCTION public.is_in_shared_workspace(user_to_check_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members wm1
    JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid() AND wm2.user_id = user_to_check_id
  );
END;
$$;

-- Step 2: Drop the existing policy on the profiles table to replace it.
DROP POLICY IF EXISTS "Users can view profiles of members in shared workspaces" ON public.profiles;

-- Step 3: Create a new policy using the security definer function.
-- This allows a user to view a profile if they share a workspace with that profile's user,
-- or if it's their own profile.
CREATE POLICY "Users can view profiles of members in shared workspaces"
ON public.profiles FOR SELECT
USING (
  public.is_in_shared_workspace(id) OR id = auth.uid()
);
