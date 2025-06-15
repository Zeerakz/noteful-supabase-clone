
-- Create ENUM type for teamspace access level
CREATE TYPE public.teamspace_access_level AS ENUM ('public', 'private');

-- Add access_level column to teamspaces table
ALTER TABLE public.teamspaces
ADD COLUMN access_level public.teamspace_access_level NOT NULL DEFAULT 'private';
COMMENT ON COLUMN public.teamspaces.access_level IS 'Access level of the teamspace, e.g., public (all workspace members) or private (only invited members).';

-- Create ENUM type for teamspace member roles
CREATE TYPE public.teamspace_member_role AS ENUM ('admin', 'member');

-- Add role column to teamspace_members table
ALTER TABLE public.teamspace_members
ADD COLUMN role public.teamspace_member_role NOT NULL DEFAULT 'member';
COMMENT ON COLUMN public.teamspace_members.role IS 'Role of the user within the teamspace, e.g., admin or member.';

-- Update RLS policies for teamspace_members to allow teamspace admins to manage members
DROP POLICY IF EXISTS "Workspace admins can manage teamspace members" ON public.teamspace_members;
CREATE POLICY "Teamspace admins can manage teamspace members"
ON public.teamspace_members FOR ALL
USING (
  (
    -- Workspace owners/admins can manage members
    EXISTS (
      SELECT 1
      FROM public.workspace_members wm
      JOIN public.teamspaces t ON t.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid() AND t.id = public.teamspace_members.teamspace_id AND wm.role IN ('owner', 'admin')
    )
  )
  OR
  (
    -- Teamspace admins can manage members
    EXISTS (
      SELECT 1
      FROM public.teamspace_members tm
      WHERE tm.teamspace_id = public.teamspace_members.teamspace_id AND tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  )
);
COMMENT ON POLICY "Teamspace admins can manage teamspace members" ON public.teamspace_members IS 'Allows workspace admins or teamspace admins to manage members.';

-- Create a trigger to automatically add the teamspace creator as an admin
CREATE OR REPLACE FUNCTION public.add_teamspace_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.teamspace_members (teamspace_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_teamspace_created_add_creator_as_admin ON public.teamspaces;
CREATE TRIGGER on_teamspace_created_add_creator_as_admin
  AFTER INSERT ON public.teamspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.add_teamspace_creator_as_admin();
