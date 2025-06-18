
-- Create RLS policy for updating pages
CREATE POLICY "Users can update pages they have access to" 
ON public.blocks 
FOR UPDATE 
TO authenticated 
USING (
  type = 'page' AND (
    -- User is the creator of the page
    created_by = auth.uid() 
    OR 
    -- User has workspace membership that allows editing
    EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = blocks.workspace_id 
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('owner', 'admin', 'member')
    )
    OR
    -- User has explicit block permissions that allow editing
    public.get_user_final_block_permission(blocks.id, auth.uid()) IN ('edit', 'full_access')
  )
);

-- Also create a policy for selecting pages (if not already exists)
CREATE POLICY "Users can view pages they have access to" 
ON public.blocks 
FOR SELECT 
TO authenticated 
USING (
  type = 'page' AND (
    -- User is the creator of the page
    created_by = auth.uid() 
    OR 
    -- User has workspace membership
    EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = blocks.workspace_id 
      AND wm.user_id = auth.uid()
    )
    OR
    -- User has explicit block permissions
    public.get_user_final_block_permission(blocks.id, auth.uid()) <> 'none'
  )
);

-- Create policy for inserting pages
CREATE POLICY "Users can create pages in workspaces they are members of" 
ON public.blocks 
FOR INSERT 
TO authenticated 
WITH CHECK (
  type = 'page' AND 
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = blocks.workspace_id 
    AND wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  )
);

-- Create policy for deleting pages
CREATE POLICY "Users can delete pages they have full access to" 
ON public.blocks 
FOR DELETE 
TO authenticated 
USING (
  type = 'page' AND (
    -- User is the creator of the page
    created_by = auth.uid() 
    OR 
    -- User has workspace admin/owner role
    EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = blocks.workspace_id 
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('owner', 'admin')
    )
    OR
    -- User has explicit full access permission
    public.get_user_final_block_permission(blocks.id, auth.uid()) = 'full_access'
  )
);
