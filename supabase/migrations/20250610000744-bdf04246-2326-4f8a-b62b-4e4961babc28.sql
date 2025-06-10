
-- Create pages table with hierarchical structure
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  parent_page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on pages table
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view pages in workspaces they belong to
CREATE POLICY "Users can view pages in their workspaces" ON public.pages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id 
        AND (
          w.owner_user_id = auth.uid() OR
          w.is_public = true OR
          EXISTS (
            SELECT 1 FROM public.workspace_membership wm
            WHERE wm.workspace_id = w.id 
              AND wm.user_id = auth.uid() 
              AND wm.status = 'accepted'
          )
        )
    )
  );

-- Create policy for users to create pages in workspaces they belong to (editors and admins)
CREATE POLICY "Editors and admins can create pages" ON public.pages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
    AND created_by = auth.uid()
  );

-- Create policy for users to update pages in workspaces they belong to (editors and admins)
CREATE POLICY "Editors and admins can update pages" ON public.pages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

-- Create policy for users to delete pages in workspaces they belong to (admins and page creators)
CREATE POLICY "Admins and page creators can delete pages" ON public.pages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
        )
    ) OR created_by = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX idx_pages_workspace ON public.pages(workspace_id);
CREATE INDEX idx_pages_parent ON public.pages(parent_page_id);
CREATE INDEX idx_pages_created_by ON public.pages(created_by);
CREATE INDEX idx_pages_order ON public.pages(workspace_id, parent_page_id, order_index);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON public.pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
