
-- Enable RLS on all tables that don't have it
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_dependencies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fields table
CREATE POLICY "Users can view fields in accessible workspaces" ON public.fields
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON w.id = d.workspace_id
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
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON w.id = d.workspace_id
    WHERE d.id = fields.database_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
    )
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Editors and admins can update fields" ON public.fields
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON w.id = d.workspace_id
    WHERE d.id = fields.database_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
    )
  )
);

CREATE POLICY "Admins can delete fields" ON public.fields
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON w.id = d.workspace_id
    WHERE d.id = fields.database_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
    )
  )
);

-- Create RLS policies for databases table
CREATE POLICY "Users can view databases in accessible workspaces" ON public.databases
FOR SELECT USING (
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
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = databases.workspace_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
    )
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Editors and admins can update databases" ON public.databases
FOR UPDATE USING (
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
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = databases.workspace_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
    )
  )
);

-- Create RLS policies for page_properties table
CREATE POLICY "Users can view page properties in accessible workspaces" ON public.page_properties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.workspaces w ON w.id = p.workspace_id
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
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.workspaces w ON w.id = p.workspace_id
    WHERE p.id = page_properties.page_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
    )
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Editors and admins can update page properties" ON public.page_properties
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.workspaces w ON w.id = p.workspace_id
    WHERE p.id = page_properties.page_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
    )
  )
);

CREATE POLICY "Admins and property creators can delete page properties" ON public.page_properties
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.workspaces w ON w.id = p.workspace_id
    WHERE p.id = page_properties.page_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
    )
  ) OR created_by = auth.uid()
);

-- Create RLS policies for workspaces table
CREATE POLICY "Users can view accessible workspaces" ON public.workspaces
FOR SELECT USING (
  owner_user_id = auth.uid() OR
  is_public = true OR
  EXISTS (
    SELECT 1 FROM public.workspace_membership wm
    WHERE wm.workspace_id = workspaces.id 
    AND wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
  )
);

CREATE POLICY "Users can create their own workspaces" ON public.workspaces
FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners can update their workspaces" ON public.workspaces
FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces" ON public.workspaces
FOR DELETE USING (owner_user_id = auth.uid());

-- Create RLS policies for workspace_membership table
CREATE POLICY "Users can view memberships for accessible workspaces" ON public.workspace_membership
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_membership.workspace_id 
    AND w.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Workspace owners can manage memberships" ON public.workspace_membership
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_membership.workspace_id 
    AND w.owner_user_id = auth.uid()
  )
);

-- Fix the database_views constraint to include 'table' as a valid option
ALTER TABLE public.database_views DROP CONSTRAINT IF EXISTS database_views_default_view_type_check;
ALTER TABLE public.database_views ADD CONSTRAINT database_views_default_view_type_check 
CHECK (default_view_type IN ('table', 'list', 'calendar', 'kanban', 'form'));

-- Update existing RLS policies for database_views to be more permissive
DROP POLICY IF EXISTS "Users can view their own database views" ON public.database_views;
DROP POLICY IF EXISTS "Users can insert their own database views" ON public.database_views;
DROP POLICY IF EXISTS "Users can update their own database views" ON public.database_views;
DROP POLICY IF EXISTS "Users can delete their own database views" ON public.database_views;

CREATE POLICY "Users can view database views in accessible workspaces" ON public.database_views
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON w.id = d.workspace_id
    WHERE d.id = database_views.database_id 
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

CREATE POLICY "Users can manage database views in accessible workspaces" ON public.database_views
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON w.id = d.workspace_id
    WHERE d.id = database_views.database_id 
    AND (
      w.owner_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.workspace_membership wm
        WHERE wm.workspace_id = w.id 
        AND wm.user_id = auth.uid() 
        AND wm.status = 'accepted'
      )
    )
  )
);
