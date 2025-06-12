
-- Fix the database_views constraint to allow all valid view types
ALTER TABLE public.database_views DROP CONSTRAINT IF EXISTS database_views_default_view_type_check;

-- Add the correct constraint with all valid view types
ALTER TABLE public.database_views ADD CONSTRAINT database_views_default_view_type_check 
CHECK (default_view_type IN ('table', 'list', 'calendar', 'kanban', 'form'));

-- Enable RLS on database_views table
ALTER TABLE public.database_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for database_views
CREATE POLICY "Users can view their own database views" ON public.database_views
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own database views" ON public.database_views
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own database views" ON public.database_views
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own database views" ON public.database_views
FOR DELETE USING (user_id = auth.uid());
