
-- Add grouping support to the database_views table
ALTER TABLE public.database_views 
ADD COLUMN grouping_field_id uuid NULL,
ADD COLUMN grouping_collapsed_groups jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.database_views.grouping_field_id IS 'Field ID to group by, null means no grouping';
COMMENT ON COLUMN public.database_views.grouping_collapsed_groups IS 'Array of group values that are collapsed';

-- Update the database_views table constraint to include new view types if not already there
ALTER TABLE public.database_views 
DROP CONSTRAINT IF EXISTS database_views_default_view_type_check;

ALTER TABLE public.database_views 
ADD CONSTRAINT database_views_default_view_type_check 
CHECK (default_view_type IN ('table', 'list', 'timeline', 'calendar', 'kanban', 'form', 'gallery'));
