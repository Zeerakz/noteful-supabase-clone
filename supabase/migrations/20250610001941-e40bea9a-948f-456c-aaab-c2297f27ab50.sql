
-- Create blocks table for storing page content blocks
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  parent_block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB,
  pos INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on blocks table
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view blocks in pages they have access to
CREATE POLICY "Users can view blocks in accessible pages" ON public.blocks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_id 
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

-- Create policy for users to create blocks in pages they can edit
CREATE POLICY "Editors and admins can create blocks" ON public.blocks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
    AND created_by = auth.uid()
  );

-- Create policy for users to update blocks in pages they can edit
CREATE POLICY "Editors and admins can update blocks" ON public.blocks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

-- Create policy for users to delete blocks in pages they can edit (admins and block creators)
CREATE POLICY "Admins and block creators can delete blocks" ON public.blocks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
        )
    ) OR created_by = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX idx_blocks_page ON public.blocks(page_id);
CREATE INDEX idx_blocks_parent ON public.blocks(parent_block_id);
CREATE INDEX idx_blocks_created_by ON public.blocks(created_by);
CREATE INDEX idx_blocks_position ON public.blocks(page_id, parent_block_id, pos);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_blocks_updated_at 
  BEFORE UPDATE ON public.blocks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
