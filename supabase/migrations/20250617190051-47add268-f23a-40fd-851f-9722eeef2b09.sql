
-- Add soft delete columns to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN deleted_at timestamp with time zone,
ADD COLUMN deleted_by uuid REFERENCES auth.users(id);

-- Create an index for performance when querying non-deleted workspaces
CREATE INDEX idx_workspaces_not_deleted ON public.workspaces (id) WHERE deleted_at IS NULL;

-- Create a function to permanently delete old workspaces (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_workspaces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Permanently delete workspaces that have been in trash for more than 30 days
  DELETE FROM public.workspaces 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < now() - interval '30 days';
END;
$function$;

-- Create a function to restore a workspace from trash
CREATE OR REPLACE FUNCTION public.restore_workspace(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  workspace_owner uuid;
BEGIN
  -- Check if user is the owner of the workspace
  SELECT owner_user_id INTO workspace_owner
  FROM public.workspaces
  WHERE id = p_workspace_id AND deleted_at IS NOT NULL;
  
  IF workspace_owner IS NULL THEN
    RETURN false; -- Workspace not found or not deleted
  END IF;
  
  IF workspace_owner != p_user_id THEN
    RETURN false; -- User is not the owner
  END IF;
  
  -- Restore the workspace
  UPDATE public.workspaces
  SET deleted_at = NULL, deleted_by = NULL, updated_at = now()
  WHERE id = p_workspace_id;
  
  RETURN true;
END;
$function$;
