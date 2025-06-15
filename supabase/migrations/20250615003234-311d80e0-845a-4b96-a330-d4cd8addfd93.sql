
CREATE OR REPLACE FUNCTION public.is_small_workspace(workspace_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*) < 1000 
  FROM public.blocks 
  WHERE workspace_id = workspace_uuid AND type = 'page';
$function$;

CREATE OR REPLACE FUNCTION public.global_search(search_query text, user_workspace_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(type text, id uuid, title text, workspace_id uuid, created_by uuid, created_at timestamp with time zone, display_title text, display_content text, rank real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
      p.properties->>'title' as title,
      p.workspace_id,
      p.created_by,
      p.created_time as created_at,
      COALESCE(string_agg(b.content->>'text', ' '), '') as content_text
    FROM public.blocks p
    LEFT JOIN public.blocks b ON b.parent_id = p.id
    WHERE p.type = 'page'
    AND p.workspace_id IN (SELECT workspace_id FROM accessible_workspaces)
    GROUP BY p.id, p.properties, p.workspace_id, p.created_by, p.created_time
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
      p.properties->>'title' as title,
      p.workspace_id,
      b.created_by,
      b.created_time as created_at,
      p.properties->>'title' as display_title,
      COALESCE(b.content->>'text', '') as display_content,
      ts_rank(
        to_tsvector('english', 
          COALESCE(p.properties->>'title', '') || ' ' || 
          COALESCE(b.content->>'text', '')
        ),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM public.blocks b
    JOIN public.blocks p ON b.parent_id = p.id
    WHERE p.type = 'page'
    AND p.workspace_id IN (SELECT workspace_id FROM accessible_workspaces)
    AND b.content->>'text' IS NOT NULL 
    AND b.content->>'text' != ''
    AND to_tsvector('english', 
          COALESCE(p.properties->>'title', '') || ' ' || 
          COALESCE(b.content->>'text', '')
        ) @@ plainto_tsquery('english', search_query)
  )
  SELECT * FROM page_results
  UNION ALL
  SELECT * FROM block_results
  ORDER BY rank DESC, created_at DESC
  LIMIT 50;
$function$;
