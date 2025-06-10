
-- Create the databases table first (it seems to be missing)
CREATE TABLE IF NOT EXISTS public.databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS on databases table
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_databases_workspace_id ON public.databases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_databases_created_by ON public.databases(created_by);
CREATE INDEX IF NOT EXISTS idx_databases_table_name ON public.databases(table_name);

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_databases_updated_at ON public.databases;
CREATE TRIGGER update_databases_updated_at 
  BEFORE UPDATE ON public.databases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Now create all the RLS policies

-- First, let's drop existing policies if they exist and create new ones for blocks table
DROP POLICY IF EXISTS "Users can view blocks in accessible pages" ON public.blocks;
DROP POLICY IF EXISTS "Editors and admins can create blocks" ON public.blocks;
DROP POLICY IF EXISTS "Editors and admins can update blocks" ON public.blocks;
DROP POLICY IF EXISTS "Admins and block creators can delete blocks" ON public.blocks;

-- Blocks table policies
CREATE POLICY "Viewers can view blocks in accessible pages" ON public.blocks
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

CREATE POLICY "Admins can delete blocks" ON public.blocks
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
    )
  );

-- Comments table policies
DROP POLICY IF EXISTS "Users can view comments on accessible blocks" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on accessible blocks" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Viewers can view comments on accessible blocks" ON public.comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages p ON b.page_id = p.id
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE b.id = comments.block_id 
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

CREATE POLICY "Editors and admins can create comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages p ON b.page_id = p.id
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE b.id = comments.block_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

CREATE POLICY "Editors and admins can update comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages p ON b.page_id = p.id
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE b.id = comments.block_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

CREATE POLICY "Admins can delete comments" ON public.comments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages p ON b.page_id = p.id
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE b.id = comments.block_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
        )
    )
  );

-- Database views table policies
DROP POLICY IF EXISTS "Users can view their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can create their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can update their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can delete their own database view preferences" ON public.database_views;

CREATE POLICY "Viewers can view their own database view preferences" ON public.database_views
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Editors and admins can create their own database view preferences" ON public.database_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Editors and admins can update their own database view preferences" ON public.database_views
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete database view preferences" ON public.database_views
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Databases table policies
CREATE POLICY "Viewers can view databases in accessible workspaces" ON public.databases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = databases.workspace_id 
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

CREATE POLICY "Editors and admins can create databases" ON public.databases
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = databases.workspace_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

CREATE POLICY "Editors and admins can update databases" ON public.databases
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = databases.workspace_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

CREATE POLICY "Admins can delete databases" ON public.databases
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = databases.workspace_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
        )
    )
  );

-- Fields table policies
DROP POLICY IF EXISTS "Users can view fields in accessible workspaces" ON public.fields;
DROP POLICY IF EXISTS "Users can create fields" ON public.fields;
DROP POLICY IF EXISTS "Users can update their fields" ON public.fields;
DROP POLICY IF EXISTS "Users can delete their fields" ON public.fields;

CREATE POLICY "Viewers can view fields in accessible workspaces" ON public.fields
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.databases d
      JOIN public.workspaces w ON d.workspace_id = w.id
      WHERE d.id = fields.database_id
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

CREATE POLICY "Editors and admins can create fields" ON public.fields
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.databases d
      JOIN public.workspaces w ON d.workspace_id = w.id
      WHERE d.id = fields.database_id
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

CREATE POLICY "Editors and admins can update fields" ON public.fields
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.databases d
      JOIN public.workspaces w ON d.workspace_id = w.id
      WHERE d.id = fields.database_id
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

CREATE POLICY "Admins can delete fields" ON public.fields
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.databases d
      JOIN public.workspaces w ON d.workspace_id = w.id
      WHERE d.id = fields.database_id
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
        )
    )
  );

-- Page properties table policies
DROP POLICY IF EXISTS "Users can view page properties in accessible workspaces" ON public.page_properties;
DROP POLICY IF EXISTS "Users can create page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Users can update their page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Users can delete their page properties" ON public.page_properties;

CREATE POLICY "Viewers can view page properties in accessible workspaces" ON public.page_properties
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_properties.page_id 
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

CREATE POLICY "Editors and admins can create page properties" ON public.page_properties
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_properties.page_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

CREATE POLICY "Editors and admins can update page properties" ON public.page_properties
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_properties.page_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
        )
    )
  );

CREATE POLICY "Admins can delete page properties" ON public.page_properties
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_properties.page_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
        )
    )
  );

-- Pages table policies (updating for consistency)
DROP POLICY IF EXISTS "Users can view pages in their workspaces" ON public.pages;
DROP POLICY IF EXISTS "Editors and admins can create pages" ON public.pages;
DROP POLICY IF EXISTS "Editors and admins can update pages" ON public.pages;
DROP POLICY IF EXISTS "Admins and page creators can delete pages" ON public.pages;

CREATE POLICY "Viewers can view pages in their workspaces" ON public.pages
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

CREATE POLICY "Admins can delete pages" ON public.pages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id 
        AND (
          w.owner_user_id = auth.uid() OR
          public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
        )
    )
  );

-- Presence table policies
DROP POLICY IF EXISTS "Users can view presence in accessible pages" ON public.presence;
DROP POLICY IF EXISTS "Users can create their own presence" ON public.presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON public.presence;

CREATE POLICY "Viewers can view presence in accessible pages" ON public.presence
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

CREATE POLICY "All users can create their own presence" ON public.presence
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
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

CREATE POLICY "All users can update their own presence" ON public.presence
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "All users can delete their own presence" ON public.presence
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
