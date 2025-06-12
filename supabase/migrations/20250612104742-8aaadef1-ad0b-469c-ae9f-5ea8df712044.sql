
-- Fix the RLS policies for saved_database_views table to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view their own views and shared views" ON public.saved_database_views;
DROP POLICY IF EXISTS "Users can create views in accessible workspaces" ON public.saved_database_views;
DROP POLICY IF EXISTS "Users can update their own views" ON public.saved_database_views;
DROP POLICY IF EXISTS "Users can delete their own views" ON public.saved_database_views;

-- Create simpler, non-recursive policies for saved_database_views
CREATE POLICY "Users can view their own views" 
  ON public.saved_database_views 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view shared views" 
  ON public.saved_database_views 
  FOR SELECT 
  USING (is_shared = true);

CREATE POLICY "Users can create views" 
  ON public.saved_database_views 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own views" 
  ON public.saved_database_views 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own views" 
  ON public.saved_database_views 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Drop existing policies for other tables before recreating them
DROP POLICY IF EXISTS "Users can view blocks in accessible workspaces" ON public.blocks;
DROP POLICY IF EXISTS "Users can create blocks in accessible workspaces" ON public.blocks;
DROP POLICY IF EXISTS "Users can update blocks in accessible workspaces" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete blocks in accessible workspaces" ON public.blocks;

DROP POLICY IF EXISTS "Users can view pages in accessible workspaces" ON public.pages;
DROP POLICY IF EXISTS "Users can create pages in accessible workspaces" ON public.pages;
DROP POLICY IF EXISTS "Users can update pages in accessible workspaces" ON public.pages;
DROP POLICY IF EXISTS "Users can delete pages in accessible workspaces" ON public.pages;

DROP POLICY IF EXISTS "Users can view databases in accessible workspaces" ON public.databases;
DROP POLICY IF EXISTS "Users can create databases in accessible workspaces" ON public.databases;
DROP POLICY IF EXISTS "Users can update databases in accessible workspaces" ON public.databases;
DROP POLICY IF EXISTS "Users can delete databases in accessible workspaces" ON public.databases;

DROP POLICY IF EXISTS "Users can view fields in accessible databases" ON public.fields;
DROP POLICY IF EXISTS "Users can create fields in accessible databases" ON public.fields;
DROP POLICY IF EXISTS "Users can update fields in accessible databases" ON public.fields;
DROP POLICY IF EXISTS "Users can delete fields in accessible databases" ON public.fields;

DROP POLICY IF EXISTS "Users can view page properties in accessible workspaces" ON public.page_properties;
DROP POLICY IF EXISTS "Users can create page properties in accessible workspaces" ON public.page_properties;
DROP POLICY IF EXISTS "Users can update page properties in accessible workspaces" ON public.page_properties;
DROP POLICY IF EXISTS "Users can delete page properties in accessible workspaces" ON public.page_properties;

-- Enable RLS on tables that need it
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocks
CREATE POLICY "Users can view blocks in accessible workspaces" 
  ON public.blocks 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = blocks.page_id 
      AND public.user_has_workspace_access(p.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can create blocks in accessible workspaces" 
  ON public.blocks 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = blocks.page_id 
      AND public.user_has_workspace_access(p.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can update blocks in accessible workspaces" 
  ON public.blocks 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = blocks.page_id 
      AND public.user_has_workspace_access(p.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete blocks in accessible workspaces" 
  ON public.blocks 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = blocks.page_id 
      AND public.user_has_workspace_access(p.workspace_id, auth.uid())
    )
  );

-- RLS policies for pages
CREATE POLICY "Users can view pages in accessible workspaces" 
  ON public.pages 
  FOR SELECT 
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can create pages in accessible workspaces" 
  ON public.pages 
  FOR INSERT 
  WITH CHECK (public.user_has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can update pages in accessible workspaces" 
  ON public.pages 
  FOR UPDATE 
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can delete pages in accessible workspaces" 
  ON public.pages 
  FOR DELETE 
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- RLS policies for databases
CREATE POLICY "Users can view databases in accessible workspaces" 
  ON public.databases 
  FOR SELECT 
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can create databases in accessible workspaces" 
  ON public.databases 
  FOR INSERT 
  WITH CHECK (public.user_has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can update databases in accessible workspaces" 
  ON public.databases 
  FOR UPDATE 
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can delete databases in accessible workspaces" 
  ON public.databases 
  FOR DELETE 
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- RLS policies for fields
CREATE POLICY "Users can view fields in accessible databases" 
  ON public.fields 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.databases d 
      WHERE d.id = fields.database_id 
      AND public.user_has_workspace_access(d.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can create fields in accessible databases" 
  ON public.fields 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.databases d 
      WHERE d.id = fields.database_id 
      AND public.user_has_workspace_access(d.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can update fields in accessible databases" 
  ON public.fields 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.databases d 
      WHERE d.id = fields.database_id 
      AND public.user_has_workspace_access(d.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete fields in accessible databases" 
  ON public.fields 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.databases d 
      WHERE d.id = fields.database_id 
      AND public.user_has_workspace_access(d.workspace_id, auth.uid())
    )
  );

-- RLS policies for page_properties
CREATE POLICY "Users can view page properties in accessible workspaces" 
  ON public.page_properties 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_properties.page_id 
      AND public.user_has_workspace_access(p.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can create page properties in accessible workspaces" 
  ON public.page_properties 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_properties.page_id 
      AND public.user_has_workspace_access(p.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can update page properties in accessible workspaces" 
  ON public.page_properties 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_properties.page_id 
      AND public.user_has_workspace_access(p.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete page properties in accessible workspaces" 
  ON public.page_properties 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_properties.page_id 
      AND public.user_has_workspace_access(p.workspace_id, auth.uid())
    )
  );
