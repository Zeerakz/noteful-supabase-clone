
-- Create a table to store database view preferences
CREATE TABLE public.database_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  database_id uuid NOT NULL,
  user_id uuid NOT NULL,
  default_view_type text NOT NULL CHECK (default_view_type IN ('table', 'list', 'calendar', 'kanban')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(database_id, user_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.database_views ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own view preferences
CREATE POLICY "Users can view their own database view preferences" 
  ON public.database_views 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own view preferences
CREATE POLICY "Users can create their own database view preferences" 
  ON public.database_views 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own view preferences
CREATE POLICY "Users can update their own database view preferences" 
  ON public.database_views 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own view preferences
CREATE POLICY "Users can delete their own database view preferences" 
  ON public.database_views 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger to update the updated_at column
CREATE TRIGGER update_database_views_updated_at
  BEFORE UPDATE ON public.database_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
