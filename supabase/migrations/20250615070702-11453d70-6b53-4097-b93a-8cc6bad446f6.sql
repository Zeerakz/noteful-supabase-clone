
DROP FUNCTION IF EXISTS public.get_discoverable_teamspaces(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_discoverable_teamspaces(p_workspace_id uuid, p_user_id uuid)
 RETURNS TABLE(id uuid, workspace_id uuid, name text, description text, icon text, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, access_level teamspace_access_level, member_count bigint, is_member boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT
  t.id,
  t.workspace_id,
  t.name,
  t.description,
  t.icon,
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
$function$
