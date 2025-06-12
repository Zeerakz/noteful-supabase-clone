
-- Add 'gallery' to the valid view types for database_views constraint
ALTER TABLE public.database_views DROP CONSTRAINT IF EXISTS database_views_default_view_type_check;

-- Add the correct constraint with all valid view types including 'gallery'
ALTER TABLE public.database_views ADD CONSTRAINT database_views_default_view_type_check 
CHECK (default_view_type IN ('table', 'list', 'calendar', 'kanban', 'form', 'gallery'));
