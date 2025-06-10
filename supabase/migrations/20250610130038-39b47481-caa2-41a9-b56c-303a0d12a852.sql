
-- First, we need to add a database_id field to pages table to link pages to databases
ALTER TABLE public.pages ADD COLUMN database_id UUID REFERENCES public.databases(id) ON DELETE CASCADE;

-- Create an index for better performance when querying pages by database
CREATE INDEX idx_pages_database_id ON public.pages(database_id);

-- Update RLS policies for pages to handle database pages
DROP POLICY IF EXISTS "Users can view pages in accessible workspaces" ON public.pages;
CREATE POLICY "Users can view pages in accessible workspaces" ON public.pages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = pages.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create pages" ON public.pages;
CREATE POLICY "Users can create pages" ON public.pages
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = pages.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their pages" ON public.pages;
CREATE POLICY "Users can update their pages" ON public.pages
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = pages.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their pages" ON public.pages;
CREATE POLICY "Users can delete their pages" ON public.pages
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = pages.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

-- Update RLS policies for fields to properly check workspace access through database
DROP POLICY IF EXISTS "Users can view fields in accessible workspaces" ON public.fields;
CREATE POLICY "Users can view fields in accessible workspaces" ON public.fields
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.databases d
      JOIN public.workspaces w ON d.workspace_id = w.id
      WHERE d.id = fields.database_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create fields" ON public.fields;
CREATE POLICY "Users can create fields" ON public.fields
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.databases d
      JOIN public.workspaces w ON d.workspace_id = w.id
      WHERE d.id = fields.database_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their fields" ON public.fields;
CREATE POLICY "Users can update their fields" ON public.fields
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.databases d
      JOIN public.workspaces w ON d.workspace_id = w.id
      WHERE d.id = fields.database_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their fields" ON public.fields;
CREATE POLICY "Users can delete their fields" ON public.fields
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.databases d
      JOIN public.workspaces w ON d.workspace_id = w.id
      WHERE d.id = fields.database_id 
      AND w.owner_user_id = auth.uid()
    )
  );

-- Update RLS policies for page_properties to properly check access through page workspace
DROP POLICY IF EXISTS "Users can view page properties in accessible workspaces" ON public.page_properties;
CREATE POLICY "Users can view page properties in accessible workspaces" ON public.page_properties
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p 
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_properties.page_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create page properties" ON public.page_properties;
CREATE POLICY "Users can create page properties" ON public.page_properties
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pages p 
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_properties.page_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their page properties" ON public.page_properties;
CREATE POLICY "Users can update their page properties" ON public.page_properties
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pages p 
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_properties.page_id 
      AND w.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their page properties" ON public.page_properties;
CREATE POLICY "Users can delete their page properties" ON public.page_properties
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pages p 
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_properties.page_id 
      AND w.owner_user_id = auth.uid()
    )
  );
