
-- First, let's fix the workspace access function to be more comprehensive
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(target_workspace_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_membership wm
    WHERE wm.workspace_id = target_workspace_id 
    AND wm.user_id = user_id 
    AND wm.status = 'accepted'
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = target_workspace_id 
    AND w.owner_user_id = user_id
  );
$function$;

-- Drop all existing policies that we need to recreate
DROP POLICY IF EXISTS "Users can view fields in accessible workspaces" ON public.fields;
DROP POLICY IF EXISTS "Users can create fields" ON public.fields;
DROP POLICY IF EXISTS "Users can update their fields" ON public.fields;
DROP POLICY IF EXISTS "Users can delete their fields" ON public.fields;
DROP POLICY IF EXISTS "Users can manage fields in accessible workspaces" ON public.fields;

DROP POLICY IF EXISTS "Users can view databases in accessible workspaces" ON public.databases;
DROP POLICY IF EXISTS "Users can create databases" ON public.databases;
DROP POLICY IF EXISTS "Users can update their databases" ON public.databases;
DROP POLICY IF EXISTS "Users can delete their databases" ON public.databases;
DROP POLICY IF EXISTS "Users can manage databases in accessible workspaces" ON public.databases;

DROP POLICY IF EXISTS "Users can view page properties in accessible workspaces" ON public.page_properties;
DROP POLICY IF EXISTS "Users can create page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Users can update their page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Users can delete their page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Users can manage page properties in accessible workspaces" ON public.page_properties;

DROP POLICY IF EXISTS "Users can view their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can create their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can update their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can delete their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can view database views in accessible workspaces" ON public.database_views;
DROP POLICY IF EXISTS "Users can manage database views in accessible workspaces" ON public.database_views;

DROP POLICY IF EXISTS "Users can view blocks in accessible pages" ON public.blocks;
DROP POLICY IF EXISTS "Editors and admins can create blocks" ON public.blocks;
DROP POLICY IF EXISTS "Editors and admins can update blocks" ON public.blocks;
DROP POLICY IF EXISTS "Admins and block creators can delete blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can view blocks in accessible workspaces" ON public.blocks;
DROP POLICY IF EXISTS "Users can manage blocks in accessible workspaces" ON public.blocks;

DROP POLICY IF EXISTS "Users can view comments in accessible workspaces" ON public.comments;
DROP POLICY IF EXISTS "Users can manage comments in accessible workspaces" ON public.comments;

DROP POLICY IF EXISTS "Users can view templates in accessible workspaces" ON public.templates;
DROP POLICY IF EXISTS "Users can manage templates in accessible workspaces" ON public.templates;

DROP POLICY IF EXISTS "Users can view presence in accessible pages" ON public.presence;
DROP POLICY IF EXISTS "Users can create their own presence" ON public.presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON public.presence;
DROP POLICY IF EXISTS "Users can view presence in accessible workspaces" ON public.presence;
DROP POLICY IF EXISTS "Users can manage their own presence" ON public.presence;

DROP POLICY IF EXISTS "Users can view files in accessible workspaces" ON public.files;
DROP POLICY IF EXISTS "Users can manage files in accessible workspaces" ON public.files;

DROP POLICY IF EXISTS "Users can view field dependencies in accessible workspaces" ON public.field_dependencies;
DROP POLICY IF EXISTS "Users can manage field dependencies in accessible workspaces" ON public.field_dependencies;

-- Now create the comprehensive policies

-- Fields policies
CREATE POLICY "Users can view fields in accessible workspaces" ON public.fields
FOR SELECT USING (
  public.user_has_workspace_access(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = fields.database_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage fields in accessible workspaces" ON public.fields
FOR ALL USING (
  public.user_has_workspace_access(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = fields.database_id),
    auth.uid()
  )
) WITH CHECK (
  public.user_has_workspace_access(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = fields.database_id),
    auth.uid()
  ) AND created_by = auth.uid()
);

-- Database policies
CREATE POLICY "Users can view databases in accessible workspaces" ON public.databases
FOR SELECT USING (
  public.user_has_workspace_access(workspace_id, auth.uid())
);

CREATE POLICY "Users can manage databases in accessible workspaces" ON public.databases
FOR ALL USING (
  public.user_has_workspace_access(workspace_id, auth.uid())
) WITH CHECK (
  public.user_has_workspace_access(workspace_id, auth.uid()) 
  AND created_by = auth.uid()
);

-- Page properties policies
CREATE POLICY "Users can view page properties in accessible workspaces" ON public.page_properties
FOR SELECT USING (
  public.user_has_workspace_access(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = page_properties.page_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage page properties in accessible workspaces" ON public.page_properties
FOR ALL USING (
  public.user_has_workspace_access(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = page_properties.page_id),
    auth.uid()
  )
) WITH CHECK (
  public.user_has_workspace_access(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = page_properties.page_id),
    auth.uid()
  ) AND created_by = auth.uid()
);

-- Database views policies
CREATE POLICY "Users can view database views in accessible workspaces" ON public.database_views
FOR SELECT USING (
  public.user_has_workspace_access(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = database_views.database_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage database views in accessible workspaces" ON public.database_views
FOR ALL USING (
  public.user_has_workspace_access(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = database_views.database_id),
    auth.uid()
  )
) WITH CHECK (
  user_id = auth.uid()
);

-- Blocks policies
CREATE POLICY "Users can view blocks in accessible workspaces" ON public.blocks
FOR SELECT USING (
  public.user_has_workspace_access(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = blocks.page_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage blocks in accessible workspaces" ON public.blocks
FOR ALL USING (
  public.user_has_workspace_access(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = blocks.page_id),
    auth.uid()
  )
) WITH CHECK (
  created_by = auth.uid()
);

-- Comments policies
CREATE POLICY "Users can view comments in accessible workspaces" ON public.comments
FOR SELECT USING (
  public.user_has_workspace_access(
    (SELECT p.workspace_id FROM public.pages p 
     JOIN public.blocks b ON b.page_id = p.id 
     WHERE b.id = comments.block_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage comments in accessible workspaces" ON public.comments
FOR ALL USING (
  public.user_has_workspace_access(
    (SELECT p.workspace_id FROM public.pages p 
     JOIN public.blocks b ON b.page_id = p.id 
     WHERE b.id = comments.block_id),
    auth.uid()
  )
) WITH CHECK (
  user_id = auth.uid()
);

-- Templates policies
CREATE POLICY "Users can view templates in accessible workspaces" ON public.templates
FOR SELECT USING (
  public.user_has_workspace_access(workspace_id, auth.uid())
);

CREATE POLICY "Users can manage templates in accessible workspaces" ON public.templates
FOR ALL USING (
  public.user_has_workspace_access(workspace_id, auth.uid())
) WITH CHECK (
  created_by = auth.uid()
);

-- Presence policies
CREATE POLICY "Users can view presence in accessible workspaces" ON public.presence
FOR SELECT USING (
  public.user_has_workspace_access(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = presence.page_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage their own presence" ON public.presence
FOR ALL USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- Files policies (only create if they don't exist)
CREATE POLICY "Users can view files in accessible workspaces" ON public.files
FOR SELECT USING (
  public.user_has_workspace_access(workspace_id, auth.uid())
);

CREATE POLICY "Users can manage files in accessible workspaces" ON public.files
FOR ALL USING (
  public.user_has_workspace_access(workspace_id, auth.uid())
) WITH CHECK (
  uploaded_by = auth.uid()
);

-- Field dependencies policies
CREATE POLICY "Users can view field dependencies in accessible workspaces" ON public.field_dependencies
FOR SELECT USING (
  public.user_has_workspace_access(
    (SELECT d.workspace_id FROM public.databases d 
     JOIN public.fields f ON f.database_id = d.id 
     WHERE f.id = field_dependencies.source_field_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage field dependencies in accessible workspaces" ON public.field_dependencies
FOR ALL USING (
  public.user_has_workspace_access(
    (SELECT d.workspace_id FROM public.databases d 
     JOIN public.fields f ON f.database_id = d.id 
     WHERE f.id = field_dependencies.source_field_id),
    auth.uid()
  )
);
