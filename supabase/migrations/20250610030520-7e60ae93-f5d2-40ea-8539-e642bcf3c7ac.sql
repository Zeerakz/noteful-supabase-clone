
-- Create a materialized view for search indexing to improve performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.search_index AS
WITH page_content AS (
  SELECT 
    p.id,
    p.title,
    p.workspace_id,
    p.created_by,
    p.created_at,
    COALESCE(string_agg(b.content->>'text', ' '), '') as content_text
  FROM public.pages p
  LEFT JOIN public.blocks b ON b.page_id = p.id
  GROUP BY p.id, p.title, p.workspace_id, p.created_by, p.created_at
)
SELECT 
  'page'::text as type,
  pc.id,
  pc.title,
  pc.workspace_id,
  pc.created_by,
  pc.created_at,
  pc.title as display_title,
  pc.content_text as display_content,
  to_tsvector('english', COALESCE(pc.title, '') || ' ' || COALESCE(pc.content_text, '')) as search_vector
FROM page_content pc

UNION ALL

SELECT 
  'block'::text as type,
  b.id,
  p.title as title,
  p.workspace_id,
  b.created_by,
  b.created_at,
  p.title as display_title,
  COALESCE(b.content->>'text', '') as display_content,
  to_tsvector('english', 
    COALESCE(p.title, '') || ' ' || 
    COALESCE(b.content->>'text', '')
  ) as search_vector
FROM public.blocks b
JOIN public.pages p ON b.page_id = p.id
WHERE b.content->>'text' IS NOT NULL 
AND b.content->>'text' != '';

-- Create index on the materialized view for better search performance
CREATE INDEX IF NOT EXISTS idx_search_index_workspace_id ON public.search_index(workspace_id);
CREATE INDEX IF NOT EXISTS idx_search_index_search_vector ON public.search_index USING gin(search_vector);

-- Create a function to refresh the search index for specific workspaces
CREATE OR REPLACE FUNCTION public.refresh_search_index_for_workspace(workspace_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- For small workspaces, we'll refresh the entire materialized view
  -- In a production system, you might want to implement partial refresh
  REFRESH MATERIALIZED VIEW public.search_index;
$$;

-- Create a function to check if a workspace is "small" (less than 100 pages)
CREATE OR REPLACE FUNCTION public.is_small_workspace(workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) < 100 
  FROM public.pages 
  WHERE workspace_id = workspace_uuid;
$$;

-- Create trigger function for fast refresh on small workspaces
CREATE OR REPLACE FUNCTION public.trigger_search_index_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create triggers for pages table
DROP TRIGGER IF EXISTS trigger_pages_search_refresh ON public.pages;
CREATE TRIGGER trigger_pages_search_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_search_index_refresh();

-- Create triggers for blocks table  
DROP TRIGGER IF EXISTS trigger_blocks_search_refresh ON public.blocks;
CREATE TRIGGER trigger_blocks_search_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_search_index_refresh();

-- Update the global_search function to use the materialized view for better performance
CREATE OR REPLACE FUNCTION public.global_search(
  search_query text,
  user_workspace_id uuid DEFAULT NULL
)
RETURNS TABLE (
  type text,
  id uuid,
  title text,
  workspace_id uuid,
  created_by uuid,
  created_at timestamp with time zone,
  display_title text,
  display_content text,
  rank real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH accessible_workspaces AS (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
    AND (user_workspace_id IS NULL OR wm.workspace_id = user_workspace_id)
  )
  SELECT 
    si.type,
    si.id,
    si.title,
    si.workspace_id,
    si.created_by,
    si.created_at,
    si.display_title,
    si.display_content,
    ts_rank(si.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM public.search_index si
  WHERE si.workspace_id IN (SELECT workspace_id FROM accessible_workspaces)
  AND si.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, si.created_at DESC
  LIMIT 50;
$$;

-- Schedule nightly refresh of the search index at 2 AM UTC
SELECT cron.schedule(
  'nightly-search-index-refresh',
  '0 2 * * *', -- 2 AM every day
  $$
  REFRESH MATERIALIZED VIEW public.search_index;
  $$
);
