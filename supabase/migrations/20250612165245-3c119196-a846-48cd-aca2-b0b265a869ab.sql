
-- Add a new column to store visible field IDs for each saved view
ALTER TABLE public.saved_database_views 
ADD COLUMN visible_field_ids jsonb DEFAULT '[]'::jsonb;

-- Add an index for better performance when querying visible fields
CREATE INDEX idx_saved_database_views_visible_fields 
ON public.saved_database_views USING GIN (visible_field_ids);

-- Update existing views to show all fields by default
UPDATE public.saved_database_views 
SET visible_field_ids = (
  SELECT jsonb_agg(f.id)
  FROM public.fields f
  WHERE f.database_id = saved_database_views.database_id
)
WHERE visible_field_ids = '[]'::jsonb;
