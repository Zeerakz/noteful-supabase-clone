
-- Fix pages table RLS policies to allow proper access
DROP POLICY IF EXISTS "Users can view pages in their workspaces" ON public.pages;
DROP POLICY IF EXISTS "Editors and admins can create pages" ON public.pages;
DROP POLICY IF EXISTS "Editors and admins can update pages" ON public.pages;
DROP POLICY IF EXISTS "Admins and page creators can delete pages" ON public.pages;

-- Create comprehensive RLS policies for pages table
CREATE POLICY "Users can view pages in accessible workspaces" ON public.pages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = pages.workspace_id 
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
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = pages.workspace_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
    )
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Editors and admins can update pages" ON public.pages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = pages.workspace_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) IN ('admin', 'editor')
    )
  )
);

CREATE POLICY "Admins and page creators can delete pages" ON public.pages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = pages.workspace_id 
    AND (
      w.owner_user_id = auth.uid() OR
      public.get_user_workspace_role(w.id, auth.uid()) = 'admin'
    )
  ) OR created_by = auth.uid()
);
