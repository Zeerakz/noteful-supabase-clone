
-- First, let's be more thorough about dropping ALL existing policies
-- This will handle any policies that might exist with similar names

-- Drop ALL possible policy variations for pages table
DROP POLICY IF EXISTS "Users can view pages in accessible workspaces" ON public.pages;
DROP POLICY IF EXISTS "Users can view pages in their workspaces" ON public.pages;
DROP POLICY IF EXISTS "Editors and admins can create pages" ON public.pages;
DROP POLICY IF EXISTS "Editors can create pages" ON public.pages;
DROP POLICY IF EXISTS "Users can create pages" ON public.pages;
DROP POLICY IF EXISTS "Editors and admins can update pages" ON public.pages;
DROP POLICY IF EXISTS "Editors can update pages" ON public.pages;
DROP POLICY IF EXISTS "Users can update their pages" ON public.pages;
DROP POLICY IF EXISTS "Admins and page creators can delete pages" ON public.pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON public.pages;
DROP POLICY IF EXISTS "Users can delete their pages" ON public.pages;

-- Drop ALL possible policy variations for blocks table
DROP POLICY IF EXISTS "Users can view blocks in accessible pages" ON public.blocks;
DROP POLICY IF EXISTS "Users can view blocks in accessible workspaces" ON public.blocks;
DROP POLICY IF EXISTS "Editors and admins can create blocks" ON public.blocks;
DROP POLICY IF EXISTS "Editors can create blocks" ON public.blocks;
DROP POLICY IF EXISTS "Editors and admins can update blocks" ON public.blocks;
DROP POLICY IF EXISTS "Editors can update blocks" ON public.blocks;
DROP POLICY IF EXISTS "Admins and block creators can delete blocks" ON public.blocks;

-- Drop ALL possible policy variations for other tables
DROP POLICY IF EXISTS "Users can view comments on accessible blocks" ON public.comments;
DROP POLICY IF EXISTS "Users can view comments in accessible workspaces" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on accessible blocks" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments in accessible workspaces" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users and admins can delete comments" ON public.comments;

-- Drop workspace policies
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view accessible workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners and admins can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;

-- Drop workspace membership policies
DROP POLICY IF EXISTS "Users can view memberships for workspaces they belong to" ON public.workspace_membership;
DROP POLICY IF EXISTS "Users can view memberships for accessible workspaces" ON public.workspace_membership;
DROP POLICY IF EXISTS "Workspace owners and admins can create memberships" ON public.workspace_membership;
DROP POLICY IF EXISTS "Workspace admins can manage memberships" ON public.workspace_membership;
DROP POLICY IF EXISTS "Users can update their own membership status" ON public.workspace_membership;
DROP POLICY IF EXISTS "Workspace owners and admins can update memberships" ON public.workspace_membership;
DROP POLICY IF EXISTS "Workspace owners and admins can delete memberships" ON public.workspace_membership;

-- Drop database-related policies
DROP POLICY IF EXISTS "Users can view databases in accessible workspaces" ON public.databases;
DROP POLICY IF EXISTS "Users can create databases" ON public.databases;
DROP POLICY IF EXISTS "Editors can create databases" ON public.databases;
DROP POLICY IF EXISTS "Users can update their databases" ON public.databases;
DROP POLICY IF EXISTS "Editors can update databases" ON public.databases;
DROP POLICY IF EXISTS "Users can delete their databases" ON public.databases;
DROP POLICY IF EXISTS "Admins can delete databases" ON public.databases;

-- Drop field policies
DROP POLICY IF EXISTS "Users can view fields in accessible workspaces" ON public.fields;
DROP POLICY IF EXISTS "Users can create fields" ON public.fields;
DROP POLICY IF EXISTS "Editors can create fields" ON public.fields;
DROP POLICY IF EXISTS "Users can update their fields" ON public.fields;
DROP POLICY IF EXISTS "Editors can update fields" ON public.fields;
DROP POLICY IF EXISTS "Users can delete their fields" ON public.fields;
DROP POLICY IF EXISTS "Admins can delete fields" ON public.fields;

-- Drop page properties policies
DROP POLICY IF EXISTS "Users can view page properties in accessible workspaces" ON public.page_properties;
DROP POLICY IF EXISTS "Users can create page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Editors can create page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Users can update their page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Editors can update page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Users can delete their page properties" ON public.page_properties;
DROP POLICY IF EXISTS "Admins and property creators can delete page properties" ON public.page_properties;

-- Drop database views policies
DROP POLICY IF EXISTS "Users can view their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can view database views in accessible workspaces" ON public.database_views;
DROP POLICY IF EXISTS "Users can create their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can update their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can delete their own database view preferences" ON public.database_views;
DROP POLICY IF EXISTS "Users can manage their database view preferences" ON public.database_views;

-- Drop template policies
DROP POLICY IF EXISTS "Users can view templates in their workspaces" ON public.templates;
DROP POLICY IF EXISTS "Users can view templates in accessible workspaces" ON public.templates;
DROP POLICY IF EXISTS "Editors and admins can create templates" ON public.templates;
DROP POLICY IF EXISTS "Editors can create templates" ON public.templates;
DROP POLICY IF EXISTS "Editors and admins can update templates" ON public.templates;
DROP POLICY IF EXISTS "Template creators and admins can update templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.templates;
DROP POLICY IF EXISTS "Template creators and admins can delete templates" ON public.templates;

-- Drop presence policies
DROP POLICY IF EXISTS "Users can view presence in accessible pages" ON public.presence;
DROP POLICY IF EXISTS "Users can view presence in accessible workspaces" ON public.presence;
DROP POLICY IF EXISTS "Users can create their own presence" ON public.presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON public.presence;
DROP POLICY IF EXISTS "Users can manage their own presence" ON public.presence;

-- Drop file policies
DROP POLICY IF EXISTS "Users can view files in accessible workspaces" ON public.files;
DROP POLICY IF EXISTS "Users can upload files to accessible workspaces" ON public.files;
DROP POLICY IF EXISTS "Editors can upload files" ON public.files;
DROP POLICY IF EXISTS "Users can update their files in accessible workspaces" ON public.files;
DROP POLICY IF EXISTS "File uploaders and admins can update files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their files in accessible workspaces" ON public.files;
DROP POLICY IF EXISTS "File uploaders and admins can delete files" ON public.files;

-- Drop field dependencies policies
DROP POLICY IF EXISTS "Users can view field dependencies in accessible workspaces" ON public.field_dependencies;
DROP POLICY IF EXISTS "Users can create field dependencies" ON public.field_dependencies;
DROP POLICY IF EXISTS "Users can delete field dependencies" ON public.field_dependencies;
DROP POLICY IF EXISTS "Editors can manage field dependencies" ON public.field_dependencies;

-- Now recreate the functions (they should replace existing ones)
CREATE OR REPLACE FUNCTION public.user_has_workspace_access_with_role(
  target_workspace_id uuid, 
  user_id uuid, 
  required_role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  -- Check if user is workspace owner (always has access)
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = target_workspace_id 
      AND w.owner_user_id = user_id
    ) THEN TRUE
    -- Check membership and role if specified
    WHEN EXISTS (
      SELECT 1 FROM public.workspace_membership wm
      JOIN public.roles r ON wm.role_id = r.id
      WHERE wm.workspace_id = target_workspace_id 
      AND wm.user_id = user_id 
      AND wm.status = 'accepted'
      AND (required_role IS NULL OR r.role_name = required_role)
    ) THEN TRUE
    ELSE FALSE
  END;
$function$;

-- Function to check if user can edit in workspace (admin or editor)
CREATE OR REPLACE FUNCTION public.user_can_edit_workspace(
  target_workspace_id uuid, 
  user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.user_has_workspace_access_with_role(
    target_workspace_id, 
    user_id, 
    'admin'
  ) OR public.user_has_workspace_access_with_role(
    target_workspace_id, 
    user_id, 
    'editor'
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = target_workspace_id 
    AND w.owner_user_id = user_id
  );
$function$;

-- Function to check if user is admin in workspace
CREATE OR REPLACE FUNCTION public.user_is_workspace_admin(
  target_workspace_id uuid, 
  user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.user_has_workspace_access_with_role(
    target_workspace_id, 
    user_id, 
    'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = target_workspace_id 
    AND w.owner_user_id = user_id
  );
$function$;

-- WORKSPACES TABLE POLICIES
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

-- WORKSPACE MEMBERSHIP POLICIES
CREATE POLICY "Users can view memberships for accessible workspaces" ON public.workspace_membership
FOR SELECT USING (
  user_id = auth.uid() OR
  public.user_has_workspace_access_with_role(workspace_id, auth.uid())
);

CREATE POLICY "Workspace admins can manage memberships" ON public.workspace_membership
FOR ALL USING (
  public.user_is_workspace_admin(workspace_id, auth.uid())
) WITH CHECK (
  public.user_is_workspace_admin(workspace_id, auth.uid())
);

-- PAGES TABLE POLICIES
CREATE POLICY "Users can view pages in accessible workspaces" ON public.pages
FOR SELECT USING (
  public.user_has_workspace_access_with_role(workspace_id, auth.uid())
);

CREATE POLICY "Editors can create pages" ON public.pages
FOR INSERT WITH CHECK (
  public.user_can_edit_workspace(workspace_id, auth.uid()) 
  AND created_by = auth.uid()
);

CREATE POLICY "Editors can update pages" ON public.pages
FOR UPDATE USING (
  public.user_can_edit_workspace(workspace_id, auth.uid())
);

CREATE POLICY "Admins can delete pages" ON public.pages
FOR DELETE USING (
  public.user_is_workspace_admin(workspace_id, auth.uid())
);

-- BLOCKS TABLE POLICIES
CREATE POLICY "Users can view blocks in accessible workspaces" ON public.blocks
FOR SELECT USING (
  public.user_has_workspace_access_with_role(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = blocks.page_id),
    auth.uid()
  )
);

CREATE POLICY "Editors can create blocks" ON public.blocks
FOR INSERT WITH CHECK (
  public.user_can_edit_workspace(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = blocks.page_id),
    auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Editors can update blocks" ON public.blocks
FOR UPDATE USING (
  public.user_can_edit_workspace(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = blocks.page_id),
    auth.uid()
  )
);

CREATE POLICY "Admins and block creators can delete blocks" ON public.blocks
FOR DELETE USING (
  public.user_is_workspace_admin(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = blocks.page_id),
    auth.uid()
  ) OR created_by = auth.uid()
);

-- DATABASES TABLE POLICIES
CREATE POLICY "Users can view databases in accessible workspaces" ON public.databases
FOR SELECT USING (
  public.user_has_workspace_access_with_role(workspace_id, auth.uid())
);

CREATE POLICY "Editors can create databases" ON public.databases
FOR INSERT WITH CHECK (
  public.user_can_edit_workspace(workspace_id, auth.uid()) 
  AND created_by = auth.uid()
);

CREATE POLICY "Editors can update databases" ON public.databases
FOR UPDATE USING (
  public.user_can_edit_workspace(workspace_id, auth.uid())
);

CREATE POLICY "Admins can delete databases" ON public.databases
FOR DELETE USING (
  public.user_is_workspace_admin(workspace_id, auth.uid())
);

-- FIELDS TABLE POLICIES
CREATE POLICY "Users can view fields in accessible workspaces" ON public.fields
FOR SELECT USING (
  public.user_has_workspace_access_with_role(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = fields.database_id),
    auth.uid()
  )
);

CREATE POLICY "Editors can create fields" ON public.fields
FOR INSERT WITH CHECK (
  public.user_can_edit_workspace(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = fields.database_id),
    auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Editors can update fields" ON public.fields
FOR UPDATE USING (
  public.user_can_edit_workspace(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = fields.database_id),
    auth.uid()
  )
);

CREATE POLICY "Admins can delete fields" ON public.fields
FOR DELETE USING (
  public.user_is_workspace_admin(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = fields.database_id),
    auth.uid()
  )
);

-- PAGE PROPERTIES TABLE POLICIES
CREATE POLICY "Users can view page properties in accessible workspaces" ON public.page_properties
FOR SELECT USING (
  public.user_has_workspace_access_with_role(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = page_properties.page_id),
    auth.uid()
  )
);

CREATE POLICY "Editors can create page properties" ON public.page_properties
FOR INSERT WITH CHECK (
  public.user_can_edit_workspace(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = page_properties.page_id),
    auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Editors can update page properties" ON public.page_properties
FOR UPDATE USING (
  public.user_can_edit_workspace(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = page_properties.page_id),
    auth.uid()
  )
);

CREATE POLICY "Admins and property creators can delete page properties" ON public.page_properties
FOR DELETE USING (
  public.user_is_workspace_admin(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = page_properties.page_id),
    auth.uid()
  ) OR created_by = auth.uid()
);

-- DATABASE VIEWS TABLE POLICIES
CREATE POLICY "Users can view database views in accessible workspaces" ON public.database_views
FOR SELECT USING (
  public.user_has_workspace_access_with_role(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = database_views.database_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage their database view preferences" ON public.database_views
FOR ALL USING (
  user_id = auth.uid() AND
  public.user_has_workspace_access_with_role(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = database_views.database_id),
    auth.uid()
  )
) WITH CHECK (
  user_id = auth.uid() AND
  public.user_has_workspace_access_with_role(
    (SELECT d.workspace_id FROM public.databases d WHERE d.id = database_views.database_id),
    auth.uid()
  )
);

-- COMMENTS TABLE POLICIES
CREATE POLICY "Users can view comments in accessible workspaces" ON public.comments
FOR SELECT USING (
  public.user_has_workspace_access_with_role(
    (SELECT p.workspace_id FROM public.pages p 
     JOIN public.blocks b ON b.page_id = p.id 
     WHERE b.id = comments.block_id),
    auth.uid()
  )
);

CREATE POLICY "Users can create comments in accessible workspaces" ON public.comments
FOR INSERT WITH CHECK (
  public.user_has_workspace_access_with_role(
    (SELECT p.workspace_id FROM public.pages p 
     JOIN public.blocks b ON b.page_id = p.id 
     WHERE b.id = comments.block_id),
    auth.uid()
  ) AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own comments" ON public.comments
FOR UPDATE USING (
  user_id = auth.uid() AND
  public.user_has_workspace_access_with_role(
    (SELECT p.workspace_id FROM public.pages p 
     JOIN public.blocks b ON b.page_id = p.id 
     WHERE b.id = comments.block_id),
    auth.uid()
  )
);

CREATE POLICY "Users and admins can delete comments" ON public.comments
FOR DELETE USING (
  user_id = auth.uid() OR
  public.user_is_workspace_admin(
    (SELECT p.workspace_id FROM public.pages p 
     JOIN public.blocks b ON b.page_id = p.id 
     WHERE b.id = comments.block_id),
    auth.uid()
  )
);

-- TEMPLATES TABLE POLICIES
CREATE POLICY "Users can view templates in accessible workspaces" ON public.templates
FOR SELECT USING (
  public.user_has_workspace_access_with_role(workspace_id, auth.uid())
);

CREATE POLICY "Editors can create templates" ON public.templates
FOR INSERT WITH CHECK (
  public.user_can_edit_workspace(workspace_id, auth.uid()) 
  AND created_by = auth.uid()
);

CREATE POLICY "Template creators and admins can update templates" ON public.templates
FOR UPDATE USING (
  created_by = auth.uid() OR
  public.user_is_workspace_admin(workspace_id, auth.uid())
);

CREATE POLICY "Template creators and admins can delete templates" ON public.templates
FOR DELETE USING (
  created_by = auth.uid() OR
  public.user_is_workspace_admin(workspace_id, auth.uid())
);

-- PRESENCE TABLE POLICIES
CREATE POLICY "Users can view presence in accessible workspaces" ON public.presence
FOR SELECT USING (
  public.user_has_workspace_access_with_role(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = presence.page_id),
    auth.uid()
  )
);

CREATE POLICY "Users can manage their own presence" ON public.presence
FOR ALL USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid() AND
  public.user_has_workspace_access_with_role(
    (SELECT p.workspace_id FROM public.pages p WHERE p.id = presence.page_id),
    auth.uid()
  )
);

-- FILES TABLE POLICIES
CREATE POLICY "Users can view files in accessible workspaces" ON public.files
FOR SELECT USING (
  public.user_has_workspace_access_with_role(workspace_id, auth.uid())
);

CREATE POLICY "Editors can upload files" ON public.files
FOR INSERT WITH CHECK (
  public.user_can_edit_workspace(workspace_id, auth.uid()) 
  AND uploaded_by = auth.uid()
);

CREATE POLICY "File uploaders and admins can update files" ON public.files
FOR UPDATE USING (
  uploaded_by = auth.uid() OR
  public.user_is_workspace_admin(workspace_id, auth.uid())
);

CREATE POLICY "File uploaders and admins can delete files" ON public.files
FOR DELETE USING (
  uploaded_by = auth.uid() OR
  public.user_is_workspace_admin(workspace_id, auth.uid())
);

-- FIELD DEPENDENCIES TABLE POLICIES
CREATE POLICY "Users can view field dependencies in accessible workspaces" ON public.field_dependencies
FOR SELECT USING (
  public.user_has_workspace_access_with_role(
    (SELECT d.workspace_id FROM public.databases d 
     JOIN public.fields f ON f.database_id = d.id 
     WHERE f.id = field_dependencies.source_field_id),
    auth.uid()
  )
);

CREATE POLICY "Editors can manage field dependencies" ON public.field_dependencies
FOR ALL USING (
  public.user_can_edit_workspace(
    (SELECT d.workspace_id FROM public.databases d 
     JOIN public.fields f ON f.database_id = d.id 
     WHERE f.id = field_dependencies.source_field_id),
    auth.uid()
  )
);

-- Update the gallery view constraint that was missing
ALTER TABLE public.database_views DROP CONSTRAINT IF EXISTS database_views_default_view_type_check;
ALTER TABLE public.database_views ADD CONSTRAINT database_views_default_view_type_check 
CHECK (default_view_type IN ('table', 'list', 'calendar', 'kanban', 'form', 'gallery'));
