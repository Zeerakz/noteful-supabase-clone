
-- Fix search path issues for all functions by adding SET search_path = public
-- This ensures functions have a stable search path for security

CREATE OR REPLACE FUNCTION public.user_has_workspace_access(target_workspace_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_membership wm
    WHERE wm.workspace_id = target_workspace_id 
    AND wm.user_id = user_id 
    AND wm.status = 'accepted'
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = target_workspace_id 
    AND w.owner_user_id = user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.validate_formula_field_settings(settings jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Check if required formula settings exist
  IF settings ? 'formula' AND settings ? 'return_type' THEN
    -- Validate return_type is one of the allowed values
    IF settings->>'return_type' IN ('number', 'text', 'date', 'boolean') THEN
      RETURN TRUE;
    END IF;
  END IF;
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_rollup_field_settings(settings jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Check if required rollup settings exist
  IF settings ? 'relation_field_id' AND 
     settings ? 'rollup_property' AND 
     settings ? 'aggregation' AND
     settings ? 'target_database_id' THEN
    -- Validate aggregation is one of the allowed values
    IF settings->>'aggregation' IN ('sum', 'count', 'average', 'min', 'max', 'earliest', 'latest') THEN
      RETURN TRUE;
    END IF;
  END IF;
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_field_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Validate settings for formula fields
  IF NEW.type = 'formula' THEN
    IF NOT validate_formula_field_settings(NEW.settings) THEN
      RAISE EXCEPTION 'Invalid formula field settings. Required: formula, return_type';
    END IF;
  END IF;
  
  -- Validate settings for rollup fields
  IF NEW.type = 'rollup' THEN
    IF NOT validate_rollup_field_settings(NEW.settings) THEN
      RAISE EXCEPTION 'Invalid rollup field settings. Required: relation_field_id, rollup_property, aggregation, target_database_id';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_formula_field(field_id uuid, page_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  field_settings JSONB;
  formula_text TEXT;
  result TEXT;
BEGIN
  -- Get the formula from field settings
  SELECT settings INTO field_settings
  FROM public.fields
  WHERE id = field_id AND type = 'formula';
  
  IF field_settings IS NULL THEN
    RETURN NULL;
  END IF;
  
  formula_text := field_settings->>'formula';
  
  -- For now, return a placeholder result
  -- In a production system, you would implement a proper formula parser
  result := 'Calculated: ' || formula_text;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_rollup_field(field_id uuid, page_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  field_settings JSONB;
  aggregation_type TEXT;
  result TEXT;
BEGIN
  -- Get the rollup settings from field
  SELECT settings INTO field_settings
  FROM public.fields
  WHERE id = field_id AND type = 'rollup';
  
  IF field_settings IS NULL THEN
    RETURN NULL;
  END IF;
  
  aggregation_type := field_settings->>'aggregation';
  
  -- For now, return a placeholder result
  -- In a production system, you would implement proper aggregation logic
  result := 'Rollup (' || aggregation_type || '): 0';
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(workspace_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = workspace_uuid AND owner_user_id = user_uuid
  );
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  DELETE FROM public.presence 
  WHERE last_heartbeat < now() - interval '30 seconds';
$function$;

CREATE OR REPLACE FUNCTION public.get_user_workspace_role(workspace_uuid uuid, user_uuid uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT r.role_name 
  FROM public.workspace_membership wm
  JOIN public.roles r ON wm.role_id = r.id
  WHERE wm.workspace_id = workspace_uuid 
    AND wm.user_id = user_uuid 
    AND wm.status = 'accepted';
$function$;

CREATE OR REPLACE FUNCTION public.refresh_search_index_for_workspace(workspace_uuid uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  -- For small workspaces, we'll refresh the entire materialized view
  -- In a production system, you might want to implement partial refresh
  REFRESH MATERIALIZED VIEW public.search_index;
$function$;

CREATE OR REPLACE FUNCTION public.is_small_workspace(workspace_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COUNT(*) < 100 
  FROM public.pages 
  WHERE workspace_id = workspace_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_search_index_refresh()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  target_workspace_id uuid;
BEGIN
  -- Get workspace_id from the affected row
  IF TG_TABLE_NAME = 'pages' THEN
    target_workspace_id := COALESCE(NEW.workspace_id, OLD.workspace_id);
  ELSIF TG_TABLE_NAME = 'blocks' THEN
    -- Get workspace_id through the page
    SELECT p.workspace_id INTO target_workspace_id
    FROM public.pages p
    WHERE p.id = COALESCE(NEW.page_id, OLD.page_id);
  END IF;

  -- Only refresh for small workspaces to avoid performance issues
  IF target_workspace_id IS NOT NULL AND public.is_small_workspace(target_workspace_id) THEN
    PERFORM public.refresh_search_index_for_workspace(target_workspace_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.global_search(search_query text, user_workspace_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(type text, id uuid, title text, workspace_id uuid, created_by uuid, created_at timestamp with time zone, display_title text, display_content text, rank real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  WITH accessible_workspaces AS (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
    AND (user_workspace_id IS NULL OR wm.workspace_id = user_workspace_id)
  ),
  page_content AS (
    SELECT 
      p.id,
      p.title,
      p.workspace_id,
      p.created_by,
      p.created_at,
      COALESCE(string_agg(b.content->>'text', ' '), '') as content_text
    FROM public.pages p
    LEFT JOIN public.blocks b ON b.page_id = p.id
    WHERE p.workspace_id IN (SELECT workspace_id FROM accessible_workspaces)
    GROUP BY p.id, p.title, p.workspace_id, p.created_by, p.created_at
  ),
  page_results AS (
    SELECT 
      'page'::text as type,
      pc.id,
      pc.title,
      pc.workspace_id,
      pc.created_by,
      pc.created_at,
      pc.title as display_title,
      pc.content_text as display_content,
      ts_rank(
        to_tsvector('english', COALESCE(pc.title, '') || ' ' || COALESCE(pc.content_text, '')),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM page_content pc
    WHERE to_tsvector('english', COALESCE(pc.title, '') || ' ' || COALESCE(pc.content_text, '')) 
          @@ plainto_tsquery('english', search_query)
  ),
  block_results AS (
    SELECT 
      'block'::text as type,
      b.id,
      p.title as title,
      p.workspace_id,
      b.created_by,
      b.created_at,
      p.title as display_title,
      COALESCE(b.content->>'text', '') as display_content,
      ts_rank(
        to_tsvector('english', 
          COALESCE(p.title, '') || ' ' || 
          COALESCE(b.content->>'text', '')
        ),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM public.blocks b
    JOIN public.pages p ON b.page_id = p.id
    WHERE p.workspace_id IN (SELECT workspace_id FROM accessible_workspaces)
    AND b.content->>'text' IS NOT NULL 
    AND b.content->>'text' != ''
    AND to_tsvector('english', 
          COALESCE(p.title, '') || ' ' || 
          COALESCE(b.content->>'text', '')
        ) @@ plainto_tsquery('english', search_query)
  )
  SELECT * FROM page_results
  UNION ALL
  SELECT * FROM block_results
  ORDER BY rank DESC, created_at DESC
  LIMIT 50;
$function$;
