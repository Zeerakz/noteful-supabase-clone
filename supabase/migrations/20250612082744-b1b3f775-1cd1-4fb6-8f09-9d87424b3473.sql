
-- Create a new table for saved database views
CREATE TABLE public.saved_database_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  database_id uuid NOT NULL,
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  view_type text NOT NULL CHECK (view_type IN ('table', 'list', 'timeline', 'calendar', 'kanban', 'form', 'gallery')),
  filters jsonb DEFAULT '[]'::jsonb,
  sorts jsonb DEFAULT '[]'::jsonb,
  grouping_field_id uuid,
  grouping_collapsed_groups jsonb DEFAULT '[]'::jsonb,
  is_shared boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Add indexes for better performance
CREATE INDEX idx_saved_database_views_database_id ON public.saved_database_views(database_id);
CREATE INDEX idx_saved_database_views_user_id ON public.saved_database_views(user_id);
CREATE INDEX idx_saved_database_views_workspace_id ON public.saved_database_views(workspace_id);

-- Create a table for view sharing permissions
CREATE TABLE public.saved_view_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  view_id uuid NOT NULL REFERENCES public.saved_database_views(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  permission_type text NOT NULL DEFAULT 'view' CHECK (permission_type IN ('view', 'edit')),
  granted_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for view permissions
CREATE INDEX idx_saved_view_permissions_view_id ON public.saved_view_permissions(view_id);
CREATE INDEX idx_saved_view_permissions_user_id ON public.saved_view_permissions(user_id);

-- Add RLS policies for saved_database_views
ALTER TABLE public.saved_database_views ENABLE ROW LEVEL SECURITY;

-- Users can see views they created or that are shared with them
CREATE POLICY "Users can view their own views and shared views" 
  ON public.saved_database_views 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    is_shared = true OR
    id IN (
      SELECT view_id FROM public.saved_view_permissions 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create views in workspaces they have access to
CREATE POLICY "Users can create views in accessible workspaces" 
  ON public.saved_database_views 
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND
    public.user_has_workspace_access(workspace_id, auth.uid())
  );

-- Users can update their own views
CREATE POLICY "Users can update their own views" 
  ON public.saved_database_views 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Users can delete their own views
CREATE POLICY "Users can delete their own views" 
  ON public.saved_database_views 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Add RLS policies for saved_view_permissions
ALTER TABLE public.saved_view_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view permissions for views they have access to
CREATE POLICY "Users can view permissions for accessible views" 
  ON public.saved_view_permissions 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    view_id IN (
      SELECT id FROM public.saved_database_views 
      WHERE user_id = auth.uid()
    )
  );

-- View owners can grant permissions
CREATE POLICY "View owners can grant permissions" 
  ON public.saved_view_permissions 
  FOR INSERT 
  WITH CHECK (
    granted_by = auth.uid() AND
    view_id IN (
      SELECT id FROM public.saved_database_views 
      WHERE user_id = auth.uid()
    )
  );

-- View owners can revoke permissions
CREATE POLICY "View owners can revoke permissions" 
  ON public.saved_view_permissions 
  FOR DELETE 
  USING (
    granted_by = auth.uid() AND
    view_id IN (
      SELECT id FROM public.saved_database_views 
      WHERE user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_saved_database_views_updated_at
  BEFORE UPDATE ON public.saved_database_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from database_views to saved_database_views
INSERT INTO public.saved_database_views (
  database_id,
  user_id,
  workspace_id,
  name,
  view_type,
  grouping_field_id,
  grouping_collapsed_groups,
  is_default,
  created_by
)
SELECT 
  dv.database_id,
  dv.user_id,
  d.workspace_id,
  'Default View' as name,
  dv.default_view_type as view_type,
  dv.grouping_field_id,
  dv.grouping_collapsed_groups,
  true as is_default,
  dv.user_id as created_by
FROM public.database_views dv
JOIN public.databases d ON d.id = dv.database_id;

-- Add comment to explain the tables
COMMENT ON TABLE public.saved_database_views IS 'Stores named database views with filters, sorts, and display settings';
COMMENT ON TABLE public.saved_view_permissions IS 'Manages sharing permissions for database views';
