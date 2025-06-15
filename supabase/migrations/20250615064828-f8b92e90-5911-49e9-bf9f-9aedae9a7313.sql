

-- This function retrieves all discoverable teamspaces within a workspace
-- for a specific user. It also calculates the total member count for each
-- teamspace and indicates whether the current user is already a member.
-- This avoids multiple database calls from the client and improves performance.
CREATE OR REPLACE FUNCTION public.get_discoverable_teamspaces(p_workspace_id uuid, p_user_id uuid)
RETURNS TABLE(
  id uuid,
  workspace_id uuid,
  name text,
  description text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  access_level public.teamspace_access_level,
  member_count bigint,
  is_member boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
SELECT
  t.id,
  t.workspace_id,
  t.name,
  t.description,
  t.created_by,
  t.created_at,
  t.updated_at,
  t.access_level,
  (SELECT count(*) FROM public.teamspace_members tm WHERE tm.teamspace_id = t.id) as member_count,
  EXISTS (SELECT 1 FROM public.teamspace_members tm WHERE tm.teamspace_id = t.id AND tm.user_id = p_user_id) as is_member
FROM
  public.teamspaces t
WHERE
  t.workspace_id = p_workspace_id
  AND public.check_workspace_membership(t.workspace_id, p_user_id);
$$;

